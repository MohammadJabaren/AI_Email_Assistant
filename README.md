This project is based on:
- [chatbot-ollama](https://github.com/ivanfioravanti/chatbot-ollama) by Ivan Fioravanti
- [Original work by Mckay Wrigley](https://github.com/mckaywrigley)
- 

Licensed under the MIT License.


AI Email Assistant

    An intelligent email assistant powered by AI that helps you write, enhance, summarize, and reply to emails using natural language     
    processing and voice input.

🚀 Features

    -🤖 AI-powered email writing and enhancement
    
    -🎤 Voice input for hands-free email composition
    
    -🌍 Multi-language support
    
    -🎭 Multiple tone options (Professional, Friendly, Formal, etc.)
    
    -💬 Real-time chat interface
    
    -📱 Responsive design
    
    -💾 Local storage for chat history


🔧 Deployment

The application is automatically deployed using GitHub Actions.

* Prerequisites:
    Before triggering deployment, make sure you:
    
      Provision two EC2 instances:
      
            Frontend Instance: Hosts the Next.js app
            
            Ollama Instance: Runs the AI model service
            
      Configure GitHub secrets in your repository:
      
            Secret Name	Description
            SSH_PRIVATE_KEY	Private key for SSH access to EC2
            EC2_HOST	Public IP
            EC2_USERNAME	SSH username (e.g., ubuntu)
            OLLAMA_SERVICE_IP	Private IP of the Ollama instance

⚙️ One-Click Deployment via Pull Request
  Get your own assistant running in 3 easy steps:
    
    Clone the repo:
      git clone https://github.com/yourusername/ai-email-assistant.git
      cd ai-email-assistant
    
    Make changes and push a branch:
      git checkout -b my-feature
      git commit -am "Customize assistant"
      git push origin my-feature
    
    Open a Pull Request:
    
      Go to GitHub → Pull Requests → New Pull Request
      Merge into main when ready
  
    🔁 On merge, GitHub Actions will:
      Run deploy.sh with the Ollama instance IP
      Deploy your changes automatically 🎉
    
