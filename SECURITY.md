# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.2.x   | :white_check_mark: |
| < 0.2.0 | :x:                |

## Reporting a Vulnerability

Project Jarvis is designed with a privacy-first, local-execution architecture. However, security is paramount. If you discover a security vulnerability within this project, please report it responsibly.

Please do **not** create public GitHub issues for security vulnerabilities. Instead, report them via private communication or security advisory channels.

### What to Include in Your Report:
- Type of vulnerability (e.g., injection, credential exposure, container escape).
- Full paths of source file(s) related to the vulnerability.
- Step-by-step instructions to reproduce the issue.
- Potential impact and mitigation recommendations.

## Security Architecture & Best Practices

1. **Air-Gapped / Local Execution**:
   - Speech-to-text (Whisper) and text-to-speech (Piper) run locally within containers.
   - Language-model inference runs via cloud LLM providers (OpenAI / Gemini / Anthropic) using your configured API keys.
   - No sensitive voice or audio data is transmitted to external cloud third parties unless configured explicitly via optional cloud fallbacks (e.g., Deepgram).

2. **Secret Management**:
   - Never commit `.env.local` or API keys to version control.
   - Use environment variables injection securely in container orchestrations.

3. **Container Hardening**:
   - Multi-stage builds are utilized to minimize attack surface and image size.
   - Non-root users and strict resource constraints (`deploy.resources`) are enforced in production deployments.
