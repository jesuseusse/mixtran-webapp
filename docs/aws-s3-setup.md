# AWS S3 + CloudFront Setup

All media for the platform (admin gallery uploads and public review photos) is stored in a single
S3 bucket served through a CloudFront distribution.

Run with your AWS CLI profile (replace `YOUR_AWS_PROFILE` with yours).

> Replace `YOUR_APP` with your application's short name (e.g. `acme`, `mybrand`).

---

## Overview

| Resource | Name / Value |
|---|---|
| S3 bucket | `YOUR_APP-media` |
| Region | `us-east-1` |
| CloudFront distribution | created below — copy the domain into env vars |
| Admin uploads prefix | `media/` |
| Review photo prefix | `reviews/` |

---

## 1. Create the S3 bucket

```bash
aws s3api create-bucket \
  --bucket YOUR_APP-media \
  --region us-east-1 \
  --profile YOUR_AWS_PROFILE
```

> `us-east-1` is the default region and does NOT use `--create-bucket-configuration`.
> For any other region add: `--create-bucket-configuration LocationConstraint=<region>`

---

## 2. Block all public access (CloudFront will be the only public entry point)

```bash
aws s3api put-public-access-block \
  --bucket YOUR_APP-media \
  --public-access-block-configuration \
    BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true \
  --profile YOUR_AWS_PROFILE
```

---

## 3. CORS policy (required for browser direct-upload via presigned PUT)

Save the following as `cors.json`:

```json
{
  "CORSRules": [
    {
      "AllowedOrigins": ["*"],
      "AllowedMethods": ["PUT", "GET"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3000
    }
  ]
}
```

Apply it:

```bash
aws s3api put-bucket-cors \
  --bucket YOUR_APP-media \
  --cors-configuration file://docs/cors.json \
  --profile YOUR_AWS_PROFILE
```

> In production tighten `AllowedOrigins` to `["https://yourdomain.com"]`.

---

## 4. Create a CloudFront Origin Access Control (OAC)

OAC is the modern replacement for OAI — it signs requests from CloudFront to S3.

```bash
aws cloudfront create-origin-access-control \
  --origin-access-control-config '{
    "Name": "YOUR_APP-media-oac",
    "Description": "OAC for YOUR_APP-media bucket",
    "SigningProtocol": "sigv4",
    "SigningBehavior": "always",
    "OriginAccessControlOriginType": "s3"
  }' \
  --profile YOUR_AWS_PROFILE
```

Note the `Id` value from the response — you will need it in the next step.

---

## 5. Create the CloudFront distribution

Replace `<OAC_ID>` with the Id from step 4 and `<BUCKET_REGIONAL_DOMAIN>` with
`YOUR_APP-media.s3.us-east-1.amazonaws.com`.

```bash
aws cloudfront create-distribution \
  --distribution-config '{
    "CallerReference": "YOUR_APP-media-dist-1",
    "Comment": "App media CDN",
    "DefaultCacheBehavior": {
      "TargetOriginId": "YOUR_APP-media-s3",
      "ViewerProtocolPolicy": "redirect-to-https",
      "CachePolicyId": "658327ea-f89d-4fab-a63d-7e88639e58f6",
      "Compress": true,
      "AllowedMethods": {
        "Quantity": 2,
        "Items": ["HEAD", "GET"],
        "CachedMethods": {"Quantity": 2, "Items": ["HEAD", "GET"]}
      }
    },
    "Origins": {
      "Quantity": 1,
      "Items": [
        {
          "Id": "YOUR_APP-media-s3",
          "DomainName": "YOUR_APP-media.s3.us-east-1.amazonaws.com",
          "S3OriginConfig": {"OriginAccessIdentity": ""},
          "OriginAccessControlId": "<OAC_ID>"
        }
      ]
    },
    "Enabled": true,
    "HttpVersion": "http2and3",
    "PriceClass": "PriceClass_100"
  }' \
  --profile YOUR_AWS_PROFILE
```

Note the distribution `DomainName` (e.g. `xxxxxxxxxxxx.cloudfront.net`) — this is
`NEXT_S3_CLOUDFRONT_URL`.

> `CachePolicyId` `658327ea-f89d-4fab-a63d-7e88639e58f6` is the AWS-managed
> **CachingOptimized** policy. No further cache configuration needed.

---

## 6. Attach the bucket policy so CloudFront can read objects

Replace `<DISTRIBUTION_ARN>` with the distribution ARN from step 5
(format: `arn:aws:cloudfront::<YOUR_ACCOUNT_ID>:distribution/<DISTRIBUTION_ID>`).

Save as `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowCloudFrontServicePrincipal",
      "Effect": "Allow",
      "Principal": {
        "Service": "cloudfront.amazonaws.com"
      },
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_APP-media/*",
      "Condition": {
        "StringEquals": {
          "AWS:SourceArn": "<DISTRIBUTION_ARN>"
        }
      }
    }
  ]
}
```

Apply it:

```bash
aws s3api put-bucket-policy \
  --bucket YOUR_APP-media \
  --policy file://docs/bucket-policy.json \
  --profile YOUR_AWS_PROFILE
```

---

## 7. IAM permissions for the runtime user

The runtime user needs to generate presigned PUT URLs and nothing else.
Add this inline policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::YOUR_APP-media/*"
    }
  ]
}
```

> `s3:GetObject` is intentionally excluded — objects are always read through CloudFront,
> never directly from S3.

---

## 8. Set environment variables

In your hosting provider's environment settings:

| Variable | Value |
|---|---|
| `NEXT_S3_BUCKET_NAME` | `YOUR_APP-media` |
| `NEXT_S3_CLOUDFRONT_URL` | `https://xxxxxxxxxxxx.cloudfront.net` (no trailing slash) |

Locally, add both to `.env.local`.

---

## 9. Verify

Upload a test file and confirm it is accessible via CloudFront:

```bash
# Upload a test object
aws s3 cp /tmp/test.txt s3://YOUR_APP-media/test.txt \
  --profile YOUR_AWS_PROFILE

# Confirm CloudFront serves it (replace with your distribution domain)
curl -I https://xxxxxxxxxxxx.cloudfront.net/test.txt

# Clean up
aws s3 rm s3://YOUR_APP-media/test.txt --profile YOUR_AWS_PROFILE
```

Expected: `HTTP/2 200` with `x-cache: Hit from cloudfront` on the second request.
