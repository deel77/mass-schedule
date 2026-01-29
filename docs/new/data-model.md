# Data Model

The Convex schema is defined in `convex/schema.ts`.

## Tables

### users
- `name` (string)
- `email` (string, unique)
- `passwordHash` (string)
- `isSuperadmin` (boolean)
- `createdAt` (number)

### parishes
- `name` (string, unique)
- `slug` (string, unique)
- `description` (string, optional)
- `createdAt` (number)

### parishUsers
- `userId` (id -> users)
- `parishId` (id -> parishes)
- `createdAt` (number)

### locations
- `parishId` (id -> parishes)
- `name` (string)
- `slug` (string, unique per parish)
- `description` (string, optional)
- `displayOrder` (number)
- `createdAt` (number)

### weekLabels
- `parishId` (id -> parishes)
- `startDate` (YYYY-MM-DD)
- `endDate` (YYYY-MM-DD)
- `label` (string, optional)
- `createdAt` (number)

### days
- `parishId` (id -> parishes)
- `date` (YYYY-MM-DD)
- `dayName` (string)
- `info` (string, optional)
- `weekLabelId` (id -> weekLabels, optional)
- `createdAt` (number)

### events
- `dayId` (id -> days)
- `locationId` (id -> locations)
- `eventType` (`holy-mass`, `confession`, `other`)
- `timeText` (string)
- `intention` (string, optional)
- `info` (string, optional)
- `createdAt` (number)

### apiTokens
- `name` (string)
- `tokenHash` (string, SHA-256)
- `tokenPrefix` (string, first 6 chars)
- `parishIds` (array of parish ids)
- `scopes` (array of strings)
- `isActive` (boolean)
- `createdBy` (user id, optional)
- `createdAt` (number)
- `lastUsedAt` (number, optional)
