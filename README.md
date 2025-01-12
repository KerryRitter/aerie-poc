# Strava Year-Over-Year Summary

A Remix application that shows your Strava activities summarized by year and sport type.

## Setup

1. Create a Strava API application at https://www.strava.com/settings/api
2. Copy `.env` to `.env.local` and fill in your Strava API credentials:
   - `STRAVA_CLIENT_ID`: Your Strava API application's Client ID
   - `STRAVA_CLIENT_SECRET`: Your Strava API application's Client Secret
   - `APP_URL`: The URL where your app is running (default: http://localhost:3000)
   - `SESSION_SECRET`: A random string used to encrypt session cookies

## Development

```bash
npm install
npm run dev
```

## Features

- OAuth authentication with Strava
- Fetches all your activities
- Groups activities by year and sport type
- Shows total distance and time for each sport type
- Responsive design with Tailwind CSS
