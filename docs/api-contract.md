# API Contract

This document defines the shared data structures and API endpoints used by the frontend and backend.

## User

```json
{
  "user_id": "string",
  "name": "string",
  "age": 21,
  "email": "user@example.com",
  "dietary_needs": "Vegetarian",
  "blacklist_activities": "Bungee jumping",
  "blacklist_food": "None"
}
```

## Group

```json
{
  "group_id": "string",
  "trip_name": "Osaka Weekend",
  "destination": "Osaka, Japan",
  "start_date": "2026-11-14",
  "end_date": "2026-11-17",
  "invite_code": "OSK4TRIP",
  "organizer_user_id": "string"
}
```

## Group Member

```json
{
  "group_id": "string",
  "user_id": "string",
  "joined_at": "ISO timestamp"
}
```

Trip preference fields will be coordinated with the itinerary component before finalising the schema.

---

# Person A Endpoints

## Profiles

### POST /profiles

Create the logged-in user's profile.

### GET /profiles/me

Get the logged-in user's profile.

### PUT /profiles/me

Update the logged-in user's profile.

## Groups

### POST /groups

Create a trip group.

### GET /groups

Get all groups the logged-in user belongs to.

### GET /groups/{group_id}

Get one group's details.

### POST /groups/join

Join a group using an invite code.

Request:

```json
{
  "invite_code": "OSK4TRIP"
}
```

### GET /groups/{group_id}/members

Get all members of a group.