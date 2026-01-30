SMS Container Server

This project contains a simple Express API and a static web UI that uses the same API.

Endpoints:
- POST /login -> { pin }  (valid PIN is 2345)
- POST /upload-messages -> { messages: [ ... ] }
- GET /threads
- GET /messages/:phone
- GET /health

Local dev:
- Copy `.env.example` to `.env` and set `MONGO_URI` (use MongoDB Atlas or local MongoDB).
- Install Node.js, then `npm install` and `npm start`.

Deployment:
- Use your hosting of choice (Render, Railway, Fly, etc.). Set environment variable `MONGO_URI` with your managed MongoDB.
- Ensure the process stays alive (the server itself runs an internal keep-alive ping to `/health` every 14s).

Note about pushing to GitHub and hosting: I cannot create remote GitHub repositories or hosting accounts from this environment. Follow the steps in the root workspace README to create repos and deploy.
