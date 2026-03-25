insert into public.knowledge_items (
  item_key,
  item_type,
  domain,
  title,
  summary,
  payload,
  freshness_status,
  last_checked_at,
  next_review_at,
  notes,
  is_active
)
values
  (
    'permit-cafe-dessert-business-registration',
    'permit_summary',
    'permit-guide',
    'Business registration and cafe permit checklist',
    'Core registration and permit sequence for cafe and dessert founders opening a physical store.',
    jsonb_build_object(
      'categoryId', 'cafe-dessert',
      'steps', jsonb_build_array(
        'Confirm lease and allowed business use before filing.',
        'Prepare business registration with the correct industry code.',
        'Check whether food sanitation education and local reporting are required.',
        'Review point-of-sale, receipt, and card merchant setup before opening.'
      ),
      'requiredDocuments', jsonb_build_array(
        'ID',
        'Lease agreement',
        'Business location details',
        'Store layout or local permit attachments if requested'
      ),
      'meta', jsonb_build_object(
        'agency', 'National Tax Service / local district office',
        'format', 'offline-store'
      )
    ),
    'fresh',
    '2026-03-19T09:00:00+09:00',
    '2026-03-26T09:00:00+09:00',
    'Permit sequence should be rechecked when local district requirements change.',
    true
  ),
  (
    'permit-food-business-registration',
    'permit_summary',
    'permit-guide',
    'Restaurant registration and operating permit checklist',
    'Core registration sequence for food service founders, especially where kitchen operations are involved.',
    jsonb_build_object(
      'categoryId', 'food',
      'steps', jsonb_build_array(
        'Verify zoning, venting, and kitchen facility fit before contract.',
        'Register the business with the correct restaurant-oriented industry code.',
        'Check district-level food operation reporting and sanitation education requirements.',
        'Prepare waste, utility, and delivery-operation compliance items before launch.'
      ),
      'requiredDocuments', jsonb_build_array(
        'ID',
        'Lease agreement',
        'Kitchen/facility details',
        'Local office attachments if requested'
      ),
      'meta', jsonb_build_object(
        'agency', 'National Tax Service / local district office',
        'format', 'kitchen-store'
      )
    ),
    'fresh',
    '2026-03-19T09:00:00+09:00',
    '2026-03-26T09:00:00+09:00',
    'Kitchen and sanitation requirements should always be rechecked by district.',
    true
  ),
  (
    'tax-cafe-dessert-basics',
    'tax_summary',
    'tax-guide',
    'Cafe tax setup basics',
    'Key tax setup points for first-time cafe founders before opening and in the first filing cycle.',
    jsonb_build_object(
      'categoryId', 'cafe-dessert',
      'checkpoints', jsonb_build_array(
        'Choose the correct tax treatment at registration.',
        'Prepare card merchant, receipt, and basic expense proof workflows.',
        'Separate ingredient, equipment, and interior expenses clearly.',
        'Set a filing reminder before the first VAT cycle.'
      ),
      'meta', jsonb_build_object(
        'filingFocus', 'vat-and-expense-proof',
        'risk', 'medium'
      )
    ),
    'fresh',
    '2026-03-19T09:00:00+09:00',
    '2026-03-26T09:00:00+09:00',
    'Tax treatment can vary by revenue size and operating structure.',
    true
  ),
  (
    'tax-food-basics',
    'tax_summary',
    'tax-guide',
    'Restaurant tax and expense tracking basics',
    'Foundational tax setup notes for restaurants and meal-focused businesses.',
    jsonb_build_object(
      'categoryId', 'food',
      'checkpoints', jsonb_build_array(
        'Track ingredient purchases separately from kitchen equipment.',
        'Set a routine for receipt capture and supplier proof.',
        'Prepare for VAT timing before opening month cash flow gets tight.',
        'Review delivery platform settlement records carefully.'
      ),
      'meta', jsonb_build_object(
        'filingFocus', 'vat-delivery-expenses',
        'risk', 'high'
      )
    ),
    'review_soon',
    '2026-03-16T09:00:00+09:00',
    '2026-03-23T09:00:00+09:00',
    'Delivery settlement handling should be rechecked against the latest reporting guidance.',
    true
  ),
  (
    'loan-cafe-dessert-policy-fund',
    'loan_product',
    'loan-guide',
    'Small business policy fund for cafe founders',
    'Starter guidance for policy-fund style financing used by small cafe and dessert founders.',
    jsonb_build_object(
      'categoryId', 'cafe-dessert',
      'highlights', jsonb_build_array(
        'Best used when opening capital needs to cover lease and fit-out together.',
        'Business plan clarity matters before application.',
        'Cash flow estimate and founder background are usually reviewed closely.'
      ),
      'meta', jsonb_build_object(
        'loanType', 'policy-fund',
        'difficulty', 'medium',
        'priority', 'high'
      )
    ),
    'fresh',
    '2026-03-19T09:00:00+09:00',
    '2026-03-26T09:00:00+09:00',
    'Loan conditions should be rechecked against active public notices before application.',
    true
  ),
  (
    'loan-food-policy-fund',
    'loan_product',
    'loan-guide',
    'Restaurant startup financing checklist',
    'Starter loan guidance for food founders who need to balance fit-out, kitchen setup, and early cash flow.',
    jsonb_build_object(
      'categoryId', 'food',
      'highlights', jsonb_build_array(
        'Kitchen and facility costs often raise the needed capital buffer.',
        'A realistic break-even model is important before borrowing.',
        'Menu, pricing, and delivery mix assumptions should be ready before review.'
      ),
      'meta', jsonb_build_object(
        'loanType', 'policy-fund',
        'difficulty', 'medium-high',
        'priority', 'high'
      )
    ),
    'fresh',
    '2026-03-19T09:00:00+09:00',
    '2026-03-26T09:00:00+09:00',
    'Always recheck program windows and district-specific requirements before submission.',
    true
  )
on conflict (item_key) do update
set
  title = excluded.title,
  summary = excluded.summary,
  payload = excluded.payload,
  freshness_status = excluded.freshness_status,
  last_checked_at = excluded.last_checked_at,
  next_review_at = excluded.next_review_at,
  notes = excluded.notes,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.knowledge_item_sources (
  knowledge_item_id,
  source_name,
  source_url,
  verified_at,
  expires_at,
  confidence
)
select
  items.id,
  source_data.source_name,
  source_data.source_url,
  source_data.verified_at::timestamptz,
  source_data.expires_at::timestamptz,
  source_data.confidence
from (
  values
    (
      'permit-cafe-dessert-business-registration',
      'National Tax Service',
      'https://www.nts.go.kr',
      '2026-03-19T09:00:00+09:00',
      '2026-03-26T09:00:00+09:00',
      'high'
    ),
    (
      'permit-food-business-registration',
      'National Tax Service',
      'https://www.nts.go.kr',
      '2026-03-19T09:00:00+09:00',
      '2026-03-26T09:00:00+09:00',
      'high'
    ),
    (
      'tax-cafe-dessert-basics',
      'National Tax Service',
      'https://www.nts.go.kr',
      '2026-03-19T09:00:00+09:00',
      '2026-03-26T09:00:00+09:00',
      'high'
    ),
    (
      'tax-food-basics',
      'National Tax Service',
      'https://www.nts.go.kr',
      '2026-03-16T09:00:00+09:00',
      '2026-03-23T09:00:00+09:00',
      'medium'
    ),
    (
      'loan-cafe-dessert-policy-fund',
      'Small Enterprise and Market Service',
      'https://www.semas.or.kr',
      '2026-03-19T09:00:00+09:00',
      '2026-03-26T09:00:00+09:00',
      'high'
    ),
    (
      'loan-food-policy-fund',
      'Small Enterprise and Market Service',
      'https://www.semas.or.kr',
      '2026-03-19T09:00:00+09:00',
      '2026-03-26T09:00:00+09:00',
      'high'
    )
) as source_data(item_key, source_name, source_url, verified_at, expires_at, confidence)
join public.knowledge_items items on items.item_key = source_data.item_key
where not exists (
  select 1
  from public.knowledge_item_sources existing
  where existing.knowledge_item_id = items.id
    and existing.source_url = source_data.source_url
);
