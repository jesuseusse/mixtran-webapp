/**
 * Global test setup — runs before every test file.
 * Sets required environment variables that modules read at import time.
 * Module-level mocks are declared in each individual test file using vi.mock().
 */
Object.assign(process.env, {
  NEXT_COGNITO_USER_POOL_ID: "us-east-1_testpool",
  NEXT_COGNITO_CLIENT_ID: "test-client-id",
  NEXT_COGNITO_CLIENT_SECRET: "test-secret",
  NEXT_AWS_REGION: "us-east-1",
  NEXT_SESSION_COOKIE_NAME: "paint_session",
  NEXT_DYNAMODB_TABLE_CONTACTS: "paint-contacts",
  NEXT_DYNAMODB_TABLE_SLOTS: "paint-slots",
  NEXT_DYNAMODB_TABLE_REVIEWS: "paint-reviews",
  NEXT_SES_FROM_EMAIL: "noreply@test.com",
  NEXT_SES_ADMIN_EMAIL: "admin@test.com",
  NEXT_S3_BUCKET_NAME: "test-bucket",
  NEXT_S3_CLOUDFRONT_URL: "https://cdn.test.com",
});
