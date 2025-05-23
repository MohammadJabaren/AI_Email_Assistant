import pytest
from email_service import EmailService, EmailTone
import os
from unittest.mock import patch, MagicMock

@pytest.fixture
def email_service():
    # Mock the OLLAMA_SERVICE_IP environment variable
    os.environ["OLLAMA_SERVICE_IP"] = "http://localhost:11434"
    return EmailService()

def test_language_map_initialization(email_service):
    """Test if language map is properly initialized with required languages"""
    assert 'en' in email_service.language_map
    assert 'fr' in email_service.language_map
    assert 'es' in email_service.language_map
    
    # Test English language info
    en_info = email_service.language_map['en']
    assert en_info.name == "English"
    assert en_info.formalGreeting == "Dear"
    assert en_info.closing == "Best regards,"

def test_get_tone_instructions(email_service):
    """Test tone instructions for different email tones"""
    assert "formal, business-appropriate" in email_service.get_tone_instructions(EmailTone.PROFESSIONAL)
    assert "warm and personable" in email_service.get_tone_instructions(EmailTone.FRIENDLY)
    assert "relaxed and informal" in email_service.get_tone_instructions(EmailTone.CASUAL)

def test_get_language_info(email_service):
    """Test language info retrieval"""
    # Test existing language
    en_info = email_service.get_language_info('en')
    assert en_info.name == "English"
    
    # Test non-existing language (should default to English)
    default_info = email_service.get_language_info('xyz')
    assert default_info.name == "English"

@pytest.mark.asyncio
async def test_create_email_prompt_write(email_service):
    """Test email prompt creation for write action"""
    prompt = email_service.create_email_prompt(
        text="Test content",
        tone=EmailTone.PROFESSIONAL,
        language='en'
    )
    assert "Write a new email in English" in prompt
    assert "Test content" in prompt
    assert "Dear" in prompt
    assert "Best regards" in prompt

@pytest.mark.asyncio
async def test_create_email_prompt_reply(email_service):
    """Test email prompt creation for reply action"""
    prompt = email_service.create_email_prompt(
        text="Test reply",
        tone=EmailTone.PROFESSIONAL,
        language='en',
        previous_email="Original email content"
    )
    assert "Write a response to this email" in prompt
    assert "Original email content" in prompt
    assert "Test reply" in prompt

@pytest.mark.asyncio
async def test_create_email_prompt_summarize(email_service):
    """Test email prompt creation for summarize action"""
    prompt = email_service.create_email_prompt(
        text="",
        tone=EmailTone.PROFESSIONAL,
        language='en',
        previous_email="Email to summarize"
    )
    assert "Summarize the following email" in prompt
    assert "Email to summarize" in prompt

@pytest.mark.asyncio
async def test_create_email_prompt_enhance(email_service):
    """Test email prompt creation for enhance action"""
    prompt = email_service.create_email_prompt(
        text="Enhance this",
        tone=EmailTone.PROFESSIONAL,
        language='en',
        previous_email="Original email"
    )
    assert "Enhance this email" in prompt
    assert "Original email" in prompt
    assert "Enhance this" in prompt

@pytest.mark.asyncio
async def test_handle_email_action_write(email_service):
    """Test handle_email_action for write action"""
    with patch('email_service.EmailService.generate_with_ollama') as mock_generate:
        mock_generate.return_value = "Generated email content"
        result = await email_service.handle_email_action(
            action='write',
            text="Test content",
            tone=EmailTone.PROFESSIONAL,
            language='en'
        )
        assert result == "Generated email content"
        mock_generate.assert_called_once()

@pytest.mark.asyncio
async def test_handle_email_action_reply(email_service):
    """Test handle_email_action for reply action"""
    with patch('email_service.EmailService.generate_with_ollama') as mock_generate:
        mock_generate.return_value = "Generated reply content"
        result = await email_service.handle_email_action(
            action='reply',
            text="Test reply",
            tone=EmailTone.PROFESSIONAL,
            language='en',
            previous_email="Original email"
        )
        assert result == "Generated reply content"
        mock_generate.assert_called_once()

def test_invalid_ollama_url():
    """Test initialization with invalid Ollama URL"""
    with pytest.raises(ValueError):
        EmailService(ollama_url=None)

@pytest.mark.asyncio
async def test_generate_with_ollama_error(email_service):
    """Test error handling in generate_with_ollama"""
    with patch('requests.post') as mock_post:
        mock_post.side_effect = Exception("API Error")
        with pytest.raises(Exception) as exc_info:
            await email_service.generate_with_ollama("test prompt")
        assert "Failed to generate email" in str(exc_info.value)

@pytest.mark.asyncio
async def test_generate_with_ollama_success(email_service):
    """Test successful response from generate_with_ollama"""
    mock_response = MagicMock()
    mock_response.json.return_value = {"response": "Generated content"}
    mock_response.raise_for_status = MagicMock()
    
    with patch('requests.post', return_value=mock_response) as mock_post:
        result = await email_service.generate_with_ollama("test prompt")
        assert result == "Generated content"
        mock_post.assert_called_once() 