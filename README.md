# Lovely-backend

Initially it should be a project like Tinder + Дайвинчик. 

Yet, I decided to publish it because it has a fully made Authorization system without external packages (and the most advanced one that i've ever done).

## Auth feautres

- Google OAuth from scratch
- Access token
- Refresh token (both for email and OAuth auth strategies)
- Email verification
- Password reset

## Routes list

<img width="300" height="388" alt="изображение" src="https://github.com/user-attachments/assets/9b49e25a-60bc-4330-b637-fd7b1f061b2b" />

## Project setup

First, add `.env` file

```env
FRONTEND_APP_URL=""
DATABASE_URL=""

JWT_SECRET=""
JWT_REFRESH_SECRET=""

EMAIL_SENDER_USER=""
EMAIL_SENDER_PASSWORD=""

GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REDIRECT_URI=""
```

```bash
$ yarn install
```

## Compile and run the project

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```


```bash
$ yarn install -g mau
$ mau deploy
```
