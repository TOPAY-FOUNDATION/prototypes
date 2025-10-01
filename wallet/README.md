# TOPAY Wallet

A modern, secure cryptocurrency wallet for the TOPAY blockchain ecosystem, featuring an AI-powered assistant.

## Features

- **Secure Wallet Management**: Create, import, and manage TOPAY wallets
- **Transaction History**: View and track all your transactions
- **Token Support**: Native TPY token support with extensible token management
- **AI Assistant**: Powered by ChainGPT for intelligent blockchain assistance
- **QR Code Support**: Easy address sharing and transaction scanning
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## AI Assistant Integration

The wallet includes an advanced AI assistant powered by ChainGPT that can help with:

- Wallet operations and balance inquiries
- Transaction analysis and blockchain queries
- TOPAY ecosystem education and tokenomics
- Security best practices and guidance
- Technical support for blockchain interactions

### ChainGPT Setup

1. **Get API Key**: Sign up at [ChainGPT](https://chaingpt.org/) and obtain your API key
2. **Configure Environment**: Add your API key to the `.env` file:

   ```env
   CHAINGPT_API_KEY=your_api_key_here
   CHAINGPT_API_URL=https://api.chaingpt.org/v1
   ```

3. **Fallback Mode**: If no API key is provided, the assistant will use intelligent fallback responses

## Quick Start

1. **Install Dependencies**:

   ```bash
   npm install
   ```

2. **Environment Setup**:

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**:

   ```bash
   npm run dev
   ```

4. **Open Browser**: Navigate to `http://localhost:3000`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_BLOCKCHAIN_RPC_URL` | Blockchain RPC server URL | Yes |
| `NEXT_PUBLIC_EXPLORER_URL` | Block explorer URL | Yes |
| `CHAINGPT_API_KEY` | ChainGPT API key for AI assistant | No |
| `CHAINGPT_API_URL` | ChainGPT API endpoint | No |

## Project Structure

```json
src/
├── app/                 # Next.js app router pages
├── components/          # React components
│   ├── AIAssistant.tsx  # AI assistant component
│   └── ...
├── lib/                 # Utility libraries
│   ├── chaingpt-service.ts  # ChainGPT API service
│   ├── wallet-manager.js    # Wallet management
│   └── ...
├── styles/              # CSS styles
└── types/               # TypeScript type definitions
```

## AI Assistant Features

### Intelligent Responses

- Context-aware conversations with memory
- Specialized knowledge about TOPAY blockchain
- Dynamic suggestion generation based on user queries

### Voice Integration

- Speech-to-text input support
- Text-to-speech response playback
- Voice control for hands-free operation

### Security & Privacy

- API keys stored securely in environment variables
- No sensitive data transmitted to AI service
- Fallback mode when API is unavailable

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Adding New Features

1. **AI Assistant Enhancements**: Modify `src/lib/chaingpt-service.ts`
2. **UI Components**: Add components to `src/components/`
3. **Styling**: Update `src/styles/components.css`

## Security Considerations

- Never commit API keys to version control
- Use environment variables for all sensitive configuration
- Regularly update dependencies for security patches
- Validate all user inputs before processing

## Troubleshooting

### AI Assistant Not Working

1. Check if `CHAINGPT_API_KEY` is set in `.env`
2. Verify API key is valid and has sufficient credits
3. Check network connectivity
4. Review browser console for error messages

### Wallet Connection Issues

1. Ensure blockchain RPC server is running
2. Verify `NEXT_PUBLIC_BLOCKCHAIN_RPC_URL` is correct
3. Check firewall settings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is part of the TOPAY Foundation ecosystem.

## Support

For technical support or questions about the AI assistant integration:

- Check the troubleshooting section above
- Review the ChainGPT documentation
- Contact the development team

---

**Note**: The AI assistant requires an active internet connection and valid ChainGPT API key for full functionality. Without these, it will operate in fallback mode with pre-programmed responses.
