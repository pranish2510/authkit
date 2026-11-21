module.exports = {
  openapi: "3.0.3",
  info: { title: "AuthKit API", version: "1.0.0", description: "Authentication-as-a-Service API. Refresh tokens are HttpOnly cookies; state-changing cookie endpoints require X-CSRF-Token." },
  servers: [{ url: "http://localhost:5000/api", description: "Local" }],
  components: { securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" }, applicationId: { type: "apiKey", in: "header", name: "X-Application-Id" } }, schemas: { Credentials: { type: "object", required: ["email", "password"], properties: { email: { type: "string", format: "email" }, password: { type: "string", format: "password" } } }, Register: { allOf: [{ $ref: "#/components/schemas/Credentials" }], properties: { name: { type: "string" } } } } },
  paths: {
    "/health": { get: { summary: "Service health" } },
    "/auth/csrf": { get: { summary: "Issue CSRF token" } },
    "/auth/register": { post: { summary: "Register platform user", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Register" } } } }, responses: { 201: { description: "Created" }, 422: { description: "Invalid input" }, 409: { description: "Duplicate account" } } } },
    "/auth/login": { post: { summary: "Login platform user", requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Credentials" } } } }, responses: { 200: { description: "Session created" }, 401: { description: "Invalid credentials" } } } },
    "/auth/refresh": { post: { summary: "Rotate refresh session", parameters: [{ name: "X-CSRF-Token", in: "header", required: true, schema: { type: "string" } }], responses: { 200: { description: "Rotated" }, 401: { description: "Invalid session" } } } },
    "/auth/me": { get: { summary: "Current user", security: [{ bearerAuth: [] }], responses: { 200: { description: "User" } } } },
    "/applications": { get: { summary: "List owned applications", security: [{ bearerAuth: [] }] }, post: { summary: "Create application and initial API key", security: [{ bearerAuth: [] }], requestBody: { required: true, content: { "application/json": { schema: { type: "object", required: ["name"], properties: { name: { type: "string" } } } } } }, responses: { 201: { description: "Created; API key is returned once" } } } },
    "/app-auth/register": { post: { summary: "Register application-scoped user", security: [{ applicationId: [] }], requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/Register" } } } } } },
  }
};
