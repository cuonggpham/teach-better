"""
LLM Service for AI-powered lecture analysis.

This module provides the LLM integration for analyzing lectures and generating
assessment questions based on learner profiles.
"""

import json
from typing import Optional
import os
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables from .env file
load_dotenv()


# =============================================================================
# LLM Call Function (User should replace with actual implementation)
# =============================================================================

async def call_llm(prompt: str) -> str:
    """
    Call the LLM with a prompt and return the response.
    
    Args:
        prompt: The input prompt to send to the LLM
        
    Returns:
        The LLM response as a string
    """
    client = OpenAI(
        base_url="https://ai.megallm.io/v1",
        api_key=os.environ.get("MEGALLM_API_KEY")
    )

    response = client.chat.completions.create(
        model=os.environ.get("LLM_MODEL", "gpt-3.5-turbo"),
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    return response.choices[0].message.content


# =============================================================================
# Prompt Templates
# =============================================================================

DIAGNOSIS_PROMPT_TEMPLATE = """Bạn là một chuyên gia giáo dục với nhiều năm kinh nghiệm giảng dạy. 
Hãy phân tích nội dung bài giảng sau đây và xác định các vấn đề tiềm ẩn.

**Nội dung bài giảng:**
{content}

**Thông tin về học viên:**
- Quốc tịch: {nationality}
- Trình độ: {level}

Hãy phân tích và trả về JSON với định dạng chính xác sau:
{{
    "misunderstanding_points": [
        "Liệt kê các điểm dễ gây hiểu nhầm hoặc khó tiếp thu, mỗi điểm là một string"
    ],
    "simulation": "Mô phỏng chi tiết cách học viên có thể hiểu sai nội dung, dựa trên background của họ",
    "suggestions": "Đề xuất phiên bản giải thích tối ưu, phù hợp với trình độ và nền tảng văn hóa của học viên"
}}

Chỉ trả về JSON, không có text giải thích thêm."""


QUESTION_GENERATION_PROMPT_TEMPLATE = """Dựa trên kết quả phân tích bài giảng sau, hãy tạo các câu hỏi đánh giá.

**Nội dung bài giảng:**
{content}

**Các điểm dễ hiểu nhầm đã xác định:**
{misunderstanding_points}

**Thông tin học viên:**
- Quốc tịch: {nationality}  
- Trình độ: {level}

Hãy tạo {num_questions} câu hỏi tập trung vào các điểm dễ gây hiểu nhầm.
Trả về JSON với định dạng:
{{
    "questions": [
        {{
            "question_text": "Câu hỏi",
            "type": "multiple_choice" hoặc "short_answer",
            "options": ["A. Lựa chọn 1", "B. Lựa chọn 2", "C. Lựa chọn 3", "D. Lựa chọn 4"],
            "correct_answer": "A"
        }}
    ]
}}

Với câu hỏi multiple_choice, luôn có 4 options (A, B, C, D).
Với câu hỏi short_answer, options là mảng rỗng [].

Chỉ trả về JSON, không có text giải thích thêm."""


EVALUATION_PROMPT_TEMPLATE = """Đánh giá câu trả lời của học viên.

**Câu hỏi:** {question}
**Đáp án đúng:** {correct_answer}
**Câu trả lời của học viên:** {user_answer}
**Loại câu hỏi:** {question_type}

Hãy đánh giá và trả về JSON:
{{
    "is_correct": true hoặc false,
    "feedback": "Giải thích ngắn gọn tại sao đúng/sai và gợi ý cải thiện nếu sai"
}}

Chỉ trả về JSON, không có text giải thích thêm."""


# =============================================================================
# Helper Functions
# =============================================================================

def build_diagnosis_prompt(
    content: str,
    nationality: Optional[str] = None,
    level: Optional[str] = None
) -> str:
    """Build the prompt for lecture diagnosis."""
    return DIAGNOSIS_PROMPT_TEMPLATE.format(
        content=content,
        nationality=nationality or "Không xác định",
        level=level or "Không xác định"
    )


def build_question_generation_prompt(
    content: str,
    misunderstanding_points: list,
    nationality: Optional[str] = None,
    level: Optional[str] = None,
    num_questions: int = 5
) -> str:
    """Build the prompt for question generation."""
    points_text = "\n".join(f"- {point}" for point in misunderstanding_points)
    return QUESTION_GENERATION_PROMPT_TEMPLATE.format(
        content=content,
        misunderstanding_points=points_text,
        nationality=nationality or "Không xác định",
        level=level or "Không xác định",
        num_questions=num_questions
    )


def build_evaluation_prompt(
    question: str,
    correct_answer: str,
    user_answer: str,
    question_type: str
) -> str:
    """Build the prompt for answer evaluation."""
    return EVALUATION_PROMPT_TEMPLATE.format(
        question=question,
        correct_answer=correct_answer,
        user_answer=user_answer,
        question_type=question_type
    )


def parse_llm_json_response(response: str) -> dict:
    """
    Parse JSON from LLM response, handling potential formatting issues.
    Returns mock fallback data if parsing fails.
    
    Args:
        response: The raw LLM response string
        
    Returns:
        Parsed JSON as dictionary (or mock fallback if parsing fails)
    """
    import re
    
    # Try to extract JSON from response (in case LLM adds extra text)
    response = response.strip()
    
    # Remove markdown code blocks if present
    if response.startswith("```"):
        # Remove opening ```json or ``` 
        response = re.sub(r'^```(?:json)?\s*\n?', '', response)
        # Remove closing ```
        response = re.sub(r'\n?```\s*$', '', response)
    
    # Find JSON boundaries
    start_idx = response.find('{')
    end_idx = response.rfind('}')
    
    if start_idx != -1 and end_idx != -1:
        json_str = response[start_idx:end_idx + 1]
        
        # Clean up common issues
        # Remove trailing commas before } or ]
        json_str = re.sub(r',\s*}', '}', json_str)
        json_str = re.sub(r',\s*]', ']', json_str)
        
        # Replace smart quotes with regular quotes
        json_str = json_str.replace('"', '"').replace('"', '"')
        json_str = json_str.replace(''', "'").replace(''', "'")
        
        # Try to fix unescaped double quotes inside string values
        # This regex finds quoted strings and escapes internal unescaped quotes
        def fix_string_quotes(match):
            content = match.group(1)
            # Escape unescaped double quotes inside the string content
            # Don't double-escape already escaped quotes
            fixed = re.sub(r'(?<!\\)"(?!,|\s*}|\s*]|\s*:)', '\\"', content)
            return f'"{fixed}"'
        
        # Match JSON string values (simplified pattern)
        # This attempts to fix strings with internal quotes
        try:
            result = json.loads(json_str)
            return result
        except json.JSONDecodeError:
            # Try alternative fix: remove problematic internal quotes
            # Pattern: find content between structural quotes and clean it
            lines = json_str.split('\n')
            fixed_lines = []
            for line in lines:
                # For array items (strings in arrays)
                if re.match(r'\s*"[^"]*"[^"]*"', line):
                    # Find the key-value pattern and fix value
                    parts = line.split(':', 1)
                    if len(parts) == 2:
                        key = parts[0]
                        value = parts[1].strip()
                        # Remove problematic quotes from value
                        if value.startswith('"') and (value.endswith('",') or value.endswith('"')):
                            # Extract content, escape internal quotes
                            has_comma = value.endswith(',')
                            inner = value[1:-2] if has_comma else value[1:-1]
                            inner = inner.replace('"', '\\"')
                            value = f'"{inner}"{"," if has_comma else ""}'
                        fixed_lines.append(f'{key}: {value}')
                    else:
                        fixed_lines.append(line)
                else:
                    fixed_lines.append(line)
            
            try:
                return json.loads('\n'.join(fixed_lines))
            except json.JSONDecodeError:
                pass
    
    # Try parsing the whole response
    try:
        return json.loads(response)
    except json.JSONDecodeError as e:
        # Return mock fallback data instead of raising error
        print(f"Warning: Failed to parse LLM response as JSON: {e}")
        print(f"Response was: {response[:500]}...")
        
        # Return mock diagnosis result
        return {
            "misunderstanding_points": [
                "専門用語の定義が明確ではなく、混乱しやすい。",
                "図や例が少なく、内容の流れを追いにくい。",
                "抽象的な概念が多く、具体例が不足している。"
            ],
            "simulation": "学習者は専門用語の意味を正確に理解できず、内容全体の把握が困難になる可能性があります。特に、前提知識が不足している場合、説明の流れについていけなくなることがあります。",
            "suggestions": [
                "抽象的な部分を、具体例やイラストで補足する。",
                "専門用語を使う前に、簡単な言葉で説明する。",
                "段階的に説明して、理解を確認しながら進める。",
                "動画や図表など、視覚的な教材を活用する。"
            ]
        }


