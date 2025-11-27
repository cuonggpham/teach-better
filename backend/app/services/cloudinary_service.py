import cloudinary
import cloudinary.uploader
from typing import Optional
from app.core.config import settings

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

class CloudinaryService:
    """
    Service for handling Cloudinary uploads
    """
    
    @staticmethod
    async def upload_image(
        file_content: bytes,
        filename: str,
        user_id: str,
        folder: str = None
    ) -> Optional[dict]:
        """
        Upload image to Cloudinary
        """
        try:
            folder_name = folder or settings.CLOUDINARY_FOLDER
            public_id = f"{folder_name}/avatars/{user_id}_{filename}"
            
            result = cloudinary.uploader.upload(
                file_content,
                public_id=public_id,
                overwrite=True,
                resource_type="image",
                transformation=[
                    {'width': 400, 'height': 400, 'crop': 'fill', 'gravity': 'face'},
                    {'quality': 'auto:good'}
                ]
            )
            
            return {
                'public_id': result['public_id'],
                'url': result['secure_url'],
                'width': result.get('width'),
                'height': result.get('height')
            }
            
        except Exception as e:
            print(f"Cloudinary upload error: {str(e)}")
            return None
    
    @staticmethod
    async def delete_image(public_id: str) -> bool:
        """
        Delete image from Cloudinary
        """
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get('result') == 'ok'
        except Exception as e:
            print(f"Cloudinary delete error: {str(e)}")
            return False