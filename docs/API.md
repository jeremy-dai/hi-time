# API Documentation

## Overview

The Hi-Time API is a Node.js/Express service that provides data persistence for the time tracking application. It connects to a Supabase PostgreSQL database and handles authentication, week management, and data import/export.

## Base URL

`http://localhost:8001/api`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <SUPABASE_JWT_TOKEN>
```

## Endpoints

### Health Check

-   **GET** `/health`
    -   **Description**: Check if the API is running.
    -   **Auth**: Public
    -   **Response**: `{ "status": "ok" }`

### Weeks

#### List Weeks

-   **GET** `/weeks`
    -   **Description**: Get a list of all week keys (e.g., "2025-W01") for the authenticated user.
    -   **Auth**: Required
    -   **Response**: `{ "weeks": ["2025-W01", "2025-W02"] }`

#### Get Week

-   **GET** `/weeks/:week_key`
    -   **Description**: Get data for a specific week.
    -   **Params**: `week_key` (e.g., "2025-W01")
    -   **Auth**: Required
    -   **Response**:
        ```json
        {
          "weekData": [...],
          "startingHour": 8,
          "theme": "Deep Work",
          "updatedAt": 1704067200000
        }
        ```
    -   **New Fields** 🆕:
        - `updatedAt` (number|null): Unix timestamp in milliseconds of last modification. Used for conflict detection.

#### Save Week

-   **PUT** `/weeks/:week_key`
    -   **Description**: Create or update a week's data.
    -   **Params**: `week_key` (e.g., "2025-W01")
    -   **Body**:
        ```json
        {
          "weekData": [...],
          "startingHour": 8,
          "theme": "Deep Work"
        }
        ```
    -   **Auth**: Required
    -   **Response**: `{ "ok": true }`

#### Batch Get Weeks

-   **POST** `/weeks/batch`
    -   **Description**: Fetch multiple weeks in a single request.
    -   **Body**: `{ "weekKeys": ["2025-W01", "2025-W02"] }`
    -   **Auth**: Required
    -   **Response**:
        ```json
        {
          "weeks": {
            "2025-W01": {
              "weekData": [...],
              "startingHour": 8,
              "theme": "Deep Work",
              "updatedAt": 1704067200000
            },
            "2025-W02": null
          }
        }
        ```
    -   Each week object includes the `updatedAt` timestamp (Unix milliseconds) 🆕

### Import/Export

#### Import CSV (Legacy)

-   **POST** `/weeks/:week_key/import`
    -   **Description**: Parse CSV text into JSON structure (Note: Frontend now uses client-side parsing).
    -   **Body**: `{ "csv_text": "..." }`
    -   **Auth**: Public
    -   **Response**: `{ "weekData": [...] }`

#### Export CSV

-   **GET** `/weeks/:week_key/export`
    -   **Description**: Get CSV representation of a week.
    -   **Params**: `week_key` (e.g., "2025-W01")
    -   **Auth**: Required
    -   **Response**: `{ "csv_text": "..." }`

#### Bulk Export CSV

-   **GET** `/export/bulk`
    -   **Description**: Get a combined CSV for a range of weeks.
    -   **Query**: `start` (e.g., "2025-W01"), `end` (e.g., "2025-W10")
    -   **Auth**: Required
    -   **Response**: `{ "csv_text": "..." }`

### Settings

#### Get Settings

-   **GET** `/settings`
    -   **Description**: Get user preferences (subcategories, etc.).
    -   **Auth**: Required
    -   **Response**: `{ "settings": { "subcategories": { ... } } }`

#### Save Settings

-   **PUT** `/settings`
    -   **Description**: Update user preferences.
    -   **Body**: `{ "settings": { "subcategories": { ... } } }`
    -   **Auth**: Required
    -   **Response**: `{ "ok": true }`

### Memories

#### Get Year Memories

-   **GET** `/memories/:year`
    -   **Description**: Fetch all memories for a specific year.
    -   **Params**: `year` (e.g., 2025)
    -   **Auth**: Required
    -   **Response**:
        ```json
        {
          "memories": {
            "year": 2025,
            "memories": {
              "2025-01-01": {
                "date": "2025-01-01",
                "memory": "Had a great day!",
                "tags": ["work", "achievement"],
                "mood": "great",
                "createdAt": 1704067200000,
                "updatedAt": 1704067200000
              }
            }
          }
        }
        ```
    -   Returns `null` if no memories exist for the year.

#### Save Year Memories

-   **PUT** `/memories/:year`
    -   **Description**: Create or update memories for a specific year.
    -   **Params**: `year` (e.g., 2025)
    -   **Body**:
        ```json
        {
          "memories": {
            "2025-01-01": {
              "date": "2025-01-01",
              "memory": "Had a great day!",
              "tags": ["work", "achievement"],
              "mood": "great",
              "createdAt": 1704067200000,
              "updatedAt": 1704067200000
            }
          }
        }
        ```
    -   **Auth**: Required
    -   **Response**: `{ "ok": true }`
