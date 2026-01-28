# Build and Deployment Instructions

## Local Development

### Prerequisites
- Node.js 16 or higher
- npm or yarn

### Setup Steps

1. **Install all dependencies**
```bash
npm run install-all
```

2. **Start development servers**
```bash
npm run dev
```
This will start:
- Backend server on http://localhost:3001
- Frontend dev server on http://localhost:3000

3. **Test the application**
- Open http://localhost:3000 in your browser
- Create a room and test multiplayer functionality

## Production Build

### Build Frontend
```bash
npm run build
```
This creates an optimized build in the `client/build` directory.

### Start Production Server
```bash
npm start
```
The server will serve both the API and the static React app.

## Render Deployment

### Step 1: Prepare Repository

1. **Push code to GitHub**
2. **Ensure all dependencies are in package.json**
3. **Update CORS configuration** for your production domain

### Step 2: Create Render Web Service

1. **Go to Render Dashboard** → "New" → "Web Service"
2. **Connect your GitHub repository**
3. **Configure the service:**

**Basic Settings:**
- Name: chain-reaction-game
- Environment: Node
- Region: Choose nearest region
- Branch: main

**Build Settings:**
- Build Command: `npm install && npm run build`
- Start Command: `npm start`

**Advanced Settings:**
- Root Directory: `/` (leave empty)
- Runtime: Node 18 (or latest)
- Health Check Path: `/api/rooms`

### Step 3: Environment Variables

Add these environment variables in Render:

```
NODE_ENV=production
PORT=3001
REACT_APP_SERVER_URL=https://your-app-name.onrender.com
```

### Step 4: Update CORS Configuration

In `server/index.js`, update the CORS origin:

```javascript
const io = socketIo(server, {
  cors: {
    origin: ['https://your-app-name.onrender.com'],
    methods: ['GET', 'POST']
  }
});
```

### Step 5: Deploy and Test

1. **Push changes to GitHub** (Render will auto-deploy)
2. **Wait for build to complete**
3. **Test your application** at the provided URL
4. **Verify multiplayer functionality** with multiple browser tabs

## Deployment Checklist

- [ ] GitHub repository is public or connected to Render
- [ ] All dependencies are listed in package.json files
- [ ] CORS is configured for production domain
- [ ] Environment variables are set in Render
- [ ] Build command works locally
- [ ] Application starts successfully in production mode
- [ ] WebSocket connections work in production
- [ ] Voice chat works (requires HTTPS)

## Troubleshooting Render Deployment

### Build Fails
- Check the build logs in Render
- Verify all dependencies are installed
- Ensure build command is correct

### Application Won't Start
- Check start command in Render settings
- Verify PORT environment variable usage
- Check application logs for errors

### WebSocket Connection Issues
- Ensure CORS is properly configured
- Check that WebSocket URLs are correct
- Verify SSL certificate (Render provides this)

### Voice Chat Not Working
- Ensure HTTPS is enabled (Render provides this)
- Check browser console for WebRTC errors
- Verify microphone permissions

## Performance Optimization

### Client Side
- React app is already optimized with production build
- Code splitting is handled by Create React App
- Static assets are served with proper caching

### Server Side
- Socket.IO uses efficient WebSocket transport
- In-memory storage for game state
- No database queries required

### Monitoring
- Use Render's built-in metrics
- Monitor WebSocket connections
- Check error logs regularly

## Scaling Considerations

### Current Limitations
- Single server instance
- In-memory game state
- No persistent storage

### Future Improvements
- Add Redis for multi-instance scaling
- Implement database for persistent games
- Add load balancing for high traffic
- Implement room clustering

## Security Notes

### Current Security Measures
- Input validation on all user data
- CORS configuration for API access
- Room ID validation
- Turn-based game logic prevents cheating

### Additional Security Recommendations
- Rate limiting for chat messages
- Room size limits
- Connection timeout handling
- Input sanitization for usernames