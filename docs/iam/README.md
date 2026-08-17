# IAM role for the EC2 instance

Two policy documents, matching §6 of the build plan:

- **`ec2-trust-policy.json`** — the *trust relationship*: says "the EC2 service is allowed to assume this role." Needed to create the role itself.
- **`ec2-s3-inline-policy.json`** — the *permissions*: three S3 actions, scoped to the `products/` prefix in one bucket. Not `s3:*` on `*`.

Before using `ec2-s3-inline-policy.json`, replace `your-inventory-bucket-name` with your actual bucket name.

## Console steps

1. IAM → Roles → Create role → Trusted entity type: **AWS service** → Use case: **EC2** → Next (this uses the same trust relationship as `ec2-trust-policy.json` automatically — you don't need to paste it manually in the console flow).
2. Attach the AWS-managed policy `CloudWatchAgentServerPolicy`.
3. Name the role `EC2-InventoryApp-Role` and create it.
4. Open the role → Add permissions → Create inline policy → JSON tab → paste the contents of `ec2-s3-inline-policy.json` (with the bucket name filled in) → name it `ProductImageAccess` → Create policy.
5. EC2 → your instance → Actions → Security → Modify IAM role → attach `EC2-InventoryApp-Role`.

## CLI equivalent

```bash
aws iam create-role \
  --role-name EC2-InventoryApp-Role \
  --assume-role-policy-document file://ec2-trust-policy.json

aws iam attach-role-policy \
  --role-name EC2-InventoryApp-Role \
  --policy-arn arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy

aws iam put-role-policy \
  --role-name EC2-InventoryApp-Role \
  --policy-name ProductImageAccess \
  --policy-document file://ec2-s3-inline-policy.json

aws iam create-instance-profile --instance-profile-name EC2-InventoryApp-Role
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-InventoryApp-Role \
  --role-name EC2-InventoryApp-Role

aws ec2 associate-iam-instance-profile \
  --instance-id <your-instance-id> \
  --iam-instance-profile Name=EC2-InventoryApp-Role
```

Once attached, `server/src/config/s3.js` needs no code changes — `new S3Client({ region })` with no credentials block already picks up the role's temporary credentials from the instance metadata service.
