# PoliceBot

Discord bot to help moderators. 

It is primarily designed for the Discord server named "Cubeurs Francophones". If you would like to use it for a different server, you will need to update the environment variables `SERVER_ID`, `MODERATOR_ROLE_ID` and `PRISONER_ROLE_ID` in the `docker-compose.yml`.

The list of features below is a simplified overview. Use the `/help` command for the full and up-to-date description.
- Commands
  - `help`
  - `offtopic` to declare an off-topic and clean messages from appropriate members in a channel
  - `prison` to send a member to prison
  - `warning` to declare a warning for a member
  - Banning a member can be done natively in Discord
  - `info` to list all information about a member, including the history of infractions, warnings and bans
- Detections on messages sent or updated
  - Forbidden expressions, usually insulting or sexually explicit
  - Invites to servers that are not whitelisted
- Detections for logs only
  - Updates and deletions of messages, including message attachments and ghost pings
  - Creation of an infraction for one or multiple members, warning of a member
  - Ban or unban of a member

## Environment variables

### `.env` file

Create the `.env` file at root level :
```env
# Active log levels
LOG_LEVELS=debug,info,warn,error

# Configuration of purge of info log channel : at which frequency it occurs and how much time messages are conserved
TICK_INTERVAL_HOURS=6
LOG_INFO_RETENTION_DURATION_DAYS=11

# Application token from Discord developer portal (https://discord.com/developers/applications)
TOKEN=xxx

# Path to Firebase service account key file
GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/firebase_serviceAccountKey.json
```
If environment variables are injected using a different method, adjust the `docker-compose.yml` accordingly.

### Firebase service account key

Paste the Firebase service account key file to `secrets/firebase_serviceAccountKey.json` at root level.
It will be mounted as a volume, please refer to the `docker-compose.yml` for more details.

## Run commands

### Development

From the root of the local repository, run the command :
```bash
docker compose --profile dev up --build
```

The application will build the image, write logs into the console, and automatically stop after the timeout is reached (see environment variable `DEVELOPMENT_TIMEOUT_SECONDS` in the `docker-compose.yml`).

Define the alias :
```bash
alias build='docker compose --profile dev up --build'
```
Use the alias :
```bash
build
```

Get logs :
```bash
docker compose logs policebot-dev
# or
docker compose logs policebot-dev -f
```


Stop the application :
```bash
docker compose --profile dev down
```

### Production

Create a folder containing the `docker-compose.yml`, the `.env` and the Firebase service account key (see [Environment variables](#environment-variables)).

Then run the command :
```bash
docker compose --profile prod pull
docker compose --profile prod up -d
```

The application will run the pre-built image from `ghcr.io/cubeur-manchot/policebot:latest` in detached mode.

Get logs :
```bash
docker compose logs policebot
# or
docker compose logs policebot -f
```

Stop the application :
```bash
docker compose --profile prod down
```
