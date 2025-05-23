from setuptools import setup, find_packages

setup(
    name="ai-email-assistant",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "pytest==7.4.3",
        "pytest-asyncio==0.21.1",
        "pytest-cov==4.1.0",
        "requests==2.31.0",
        "aiohttp==3.9.1",
        "black==23.11.0"
    ],
    python_requires=">=3.10",
) 