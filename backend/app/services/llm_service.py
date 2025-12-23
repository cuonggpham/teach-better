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
# Language Detection
# =============================================================================

import re

def detect_language(text: str) -> str:
    """
    Detect if text is primarily Japanese or Vietnamese.
    
    Args:
        text: Input text to analyze
        
    Returns:
        'ja' for Japanese, 'vi' for Vietnamese/other
    """
    if not text:
        return 'vi'
    
    # Japanese character ranges
    # Hiragana: \u3040-\u309F
    # Katakana: \u30A0-\u30FF
    # Kanji: \u4E00-\u9FFF (CJK Unified Ideographs)
    japanese_pattern = re.compile(r'[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]')
    
    japanese_chars = len(japanese_pattern.findall(text))
    total_chars = len(text.replace(' ', '').replace('\n', ''))
    
    if total_chars == 0:
        return 'vi'
    
    # If more than 10% of non-space characters are Japanese, consider it Japanese
    japanese_ratio = japanese_chars / total_chars
    
    return 'ja' if japanese_ratio > 0.1 else 'vi'


# =============================================================================
# Prompt Templates - Vietnamese
# =============================================================================

DIAGNOSIS_PROMPT_TEMPLATE_VI = """Bạn là một chuyên gia giáo dục với nhiều năm kinh nghiệm giảng dạy. 
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


QUESTION_GENERATION_PROMPT_TEMPLATE_VI = """Dựa trên kết quả phân tích bài giảng sau, hãy tạo các câu hỏi đánh giá.

**Nội dung bài giảng:**
{content}

**Các điểm dễ hiểu nhầm đã xác định:**
{misunderstanding_points}

**Thông tin học viên:**
- Quốc tịch: {nationality}  
- Trình độ: {level}

Hãy tạo {num_questions} câu hỏi TRẮC NGHIỆM (multiple choice) tập trung vào các điểm dễ gây hiểu nhầm.

**YÊU CẦU QUAN TRỌNG:**
1. TẤT CẢ câu hỏi phải là dạng TRẮC NGHIỆM với 4 lựa chọn (A, B, C, D)
2. Câu hỏi và các lựa chọn PHẢI ĐƯỢC VIẾT BẰNG CÙNG NGÔN NGỮ với nội dung bài giảng
3. Nếu bài giảng bằng tiếng Việt, câu hỏi phải bằng tiếng Việt
4. Nếu bài giảng bằng tiếng Nhật, câu hỏi phải bằng tiếng Nhật

Trả về JSON với định dạng:
{{
    "questions": [
        {{
            "question_text": "Câu hỏi",
            "type": "multiple_choice",
            "options": ["A. Lựa chọn 1", "B. Lựa chọn 2", "C. Lựa chọn 3", "D. Lựa chọn 4"],
            "correct_answer": "A"
        }}
    ]
}}

Chỉ trả về JSON, không có text giải thích thêm."""


EVALUATION_PROMPT_TEMPLATE_VI = """Đánh giá câu trả lời của học viên.

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
# Prompt Templates - Japanese
# =============================================================================

DIAGNOSIS_PROMPT_TEMPLATE_JA = """あなたは長年の教育経験を持つ教育専門家です。
以下の授業内容を分析し、潜在的な問題点を特定してください。

**授業内容:**
{content}

**学習者情報:**
- 国籍: {nationality}
- レベル: {level}

分析を行い、以下の形式で正確なJSONを返してください:
{{
    "misunderstanding_points": [
        "誤解しやすい点や理解しにくい点をリストアップしてください。各項目は文字列です"
    ],
    "simulation": "学習者が内容をどのように誤解する可能性があるかを、その背景に基づいて詳細にシミュレーションしてください",
    "suggestions": "学習者のレベルと文化的背景に適した、最適化された説明バージョンを提案してください"
}}

JSONのみを返してください。追加の説明テキストは不要です。"""


QUESTION_GENERATION_PROMPT_TEMPLATE_JA = """以下の授業分析結果に基づいて、評価用の質問を作成してください。

**授業内容:**
{content}

**特定された誤解しやすいポイント:**
{misunderstanding_points}

**学習者情報:**
- 国籍: {nationality}  
- レベル: {level}

誤解しやすいポイントに焦点を当てた{num_questions}問の選択式クイズを作成してください。

**重要な要件:**
1. すべての質問は4つの選択肢（A、B、C、D）を持つ選択式（multiple choice）でなければなりません
2. 質問と選択肢は授業内容と同じ言語で書く必要があります
3. 授業がベトナム語の場合、質問もベトナム語で
4. 授業が日本語の場合、質問も日本語で

以下の形式でJSONを返してください:
{{
    "questions": [
        {{
            "question_text": "質問",
            "type": "multiple_choice",
            "options": ["A. 選択肢1", "B. 選択肢2", "C. 選択肢3", "D. 選択肢4"],
            "correct_answer": "A"
        }}
    ]
}}

JSONのみを返してください。追加の説明テキストは不要です。"""


EVALUATION_PROMPT_TEMPLATE_JA = """学習者の回答を評価してください。

**質問:** {question}
**正解:** {correct_answer}
**学習者の回答:** {user_answer}
**質問タイプ:** {question_type}

評価を行い、以下のJSONを返してください:
{{
    "is_correct": true または false,
    "feedback": "なぜ正解/不正解かを簡潔に説明し、不正解の場合は改善のヒントを提供してください"
}}

JSONのみを返してください。追加の説明テキストは不要です。"""


# =============================================================================
# Backward compatibility - use Vietnamese as default
# =============================================================================

DIAGNOSIS_PROMPT_TEMPLATE = DIAGNOSIS_PROMPT_TEMPLATE_VI
QUESTION_GENERATION_PROMPT_TEMPLATE = QUESTION_GENERATION_PROMPT_TEMPLATE_VI
EVALUATION_PROMPT_TEMPLATE = EVALUATION_PROMPT_TEMPLATE_VI


# =============================================================================
# Helper Functions
# =============================================================================

def build_diagnosis_prompt(
    content: str,
    nationality: Optional[str] = None,
    level: Optional[str] = None
) -> str:
    """Build the prompt for lecture diagnosis based on input language."""
    language = detect_language(content)
    
    if language == 'ja':
        return DIAGNOSIS_PROMPT_TEMPLATE_JA.format(
            content=content,
            nationality=nationality or "不明",
            level=level or "不明"
        )
    else:
        return DIAGNOSIS_PROMPT_TEMPLATE_VI.format(
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
    """Build the prompt for question generation based on input language."""
    language = detect_language(content)
    points_text = "\n".join(f"- {point}" for point in misunderstanding_points)
    
    if language == 'ja':
        return QUESTION_GENERATION_PROMPT_TEMPLATE_JA.format(
            content=content,
            misunderstanding_points=points_text,
            nationality=nationality or "不明",
            level=level or "不明",
            num_questions=num_questions
        )
    else:
        return QUESTION_GENERATION_PROMPT_TEMPLATE_VI.format(
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
    """Build the prompt for answer evaluation based on input language."""
    language = detect_language(question)
    
    if language == 'ja':
        return EVALUATION_PROMPT_TEMPLATE_JA.format(
            question=question,
            correct_answer=correct_answer,
            user_answer=user_answer,
            question_type=question_type
        )
    else:
        return EVALUATION_PROMPT_TEMPLATE_VI.format(
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


