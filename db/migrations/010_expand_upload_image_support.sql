-- Allow common phone/browser image formats for upload buckets.
-- The Next.js server action body limit is configured separately in next.config.ts.
update storage.buckets
set
  file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif']
where id in ('quote-photos', 'job-photos', 'settings-assets');

update storage.buckets
set
  file_size_limit = 8388608,
  allowed_mime_types = array['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'image/avif', 'application/pdf']
where id in ('receipts', 'payment-proofs');
