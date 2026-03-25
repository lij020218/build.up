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
    'market-cafe-dessert-seongsu',
    'location_candidate',
    'market-recommendation',
    'Seongsu',
    'Good for brand-forward cafe and dessert concepts with strong destination traffic.',
    jsonb_build_object(
      'categoryId', 'cafe-dessert',
      'score', 88,
      'reasons', jsonb_build_array(
        'Strong 20s-30s foot traffic',
        'High fit for branded cafe concepts',
        'Strong spillover from destination retail traffic'
      ),
      'warnings', jsonb_build_array(
        'Rent pressure is higher than average',
        'Competition density is already high'
      ),
      'meta', jsonb_build_object(
        'rentBand', 'high',
        'competitionLevel', 'high',
        'customerFit', 'strong'
      )
    ),
    'fresh',
    '2026-03-19T09:00:00+09:00',
    '2026-03-26T09:00:00+09:00',
    'Official market review completed for cafe and dessert positioning.',
    true
  ),
  (
    'market-cafe-dessert-mangwon',
    'location_candidate',
    'market-recommendation',
    'Mangwon',
    'Balanced fit for careful first-time founders who want repeat local demand and softer rent pressure.',
    jsonb_build_object(
      'categoryId', 'cafe-dessert',
      'score', 82,
      'reasons', jsonb_build_array(
        'Neighborhood repeat traffic is steadier',
        'Smaller-format stores can work well',
        'Better fit for careful early-stage budgeting'
      ),
      'warnings', jsonb_build_array(
        'Destination traffic is lower than Seongsu',
        'Brand lift may grow slower'
      ),
      'meta', jsonb_build_object(
        'rentBand', 'mid',
        'competitionLevel', 'mid',
        'customerFit', 'steady'
      )
    ),
    'review_soon',
    '2026-03-15T09:00:00+09:00',
    '2026-03-22T09:00:00+09:00',
    'Recheck district lease and competition changes before final contract.',
    true
  ),
  (
    'market-cafe-dessert-konkuk',
    'location_candidate',
    'market-recommendation',
    'Konkuk University',
    'Good for takeout-heavy cafe formats that need faster customer turnover.',
    jsonb_build_object(
      'categoryId', 'cafe-dessert',
      'score', 79,
      'reasons', jsonb_build_array(
        'High student and evening traffic',
        'Strong match for takeout-heavy concepts',
        'Works when fast throughput matters'
      ),
      'warnings', jsonb_build_array(
        'Price sensitivity can be higher',
        'Weekend demand may fluctuate more'
      ),
      'meta', jsonb_build_object(
        'rentBand', 'mid-high',
        'competitionLevel', 'high',
        'customerFit', 'throughput'
      )
    ),
    'fresh',
    '2026-03-19T09:00:00+09:00',
    '2026-03-26T09:00:00+09:00',
    'Official district review completed for throughput-heavy formats.',
    true
  ),
  (
    'market-food-yeoksam',
    'location_candidate',
    'market-recommendation',
    'Yeoksam',
    'Strong office lunch and dinner demand for fast casual and healthy meal formats.',
    jsonb_build_object(
      'categoryId', 'food',
      'score', 86,
      'reasons', jsonb_build_array(
        'Dense office worker demand at lunch',
        'Healthy and fast casual concepts fit well',
        'Weekday repeat demand is easier to model'
      ),
      'warnings', jsonb_build_array(
        'Weekday concentration can be heavy',
        'Dinner and weekend traffic may vary by block'
      ),
      'meta', jsonb_build_object(
        'rentBand', 'high',
        'competitionLevel', 'mid-high',
        'customerFit', 'office-repeat'
      )
    ),
    'fresh',
    '2026-03-19T09:00:00+09:00',
    '2026-03-26T09:00:00+09:00',
    'Office-area demand review completed from official district data.',
    true
  ),
  (
    'market-food-seongsu',
    'location_candidate',
    'market-recommendation',
    'Seongsu',
    'Useful for distinctive food concepts that benefit from destination traffic and brand visibility.',
    jsonb_build_object(
      'categoryId', 'food',
      'score', 81,
      'reasons', jsonb_build_array(
        'Destination traffic supports concept-led dining',
        'Brand exposure is easier than in purely residential areas',
        'Strong spillover from retail movement'
      ),
      'warnings', jsonb_build_array(
        'Rent is expensive',
        'Brand positioning must be sharper to stand out'
      ),
      'meta', jsonb_build_object(
        'rentBand', 'high',
        'competitionLevel', 'high',
        'customerFit', 'brand-destination'
      )
    ),
    'review_soon',
    '2026-03-17T09:00:00+09:00',
    '2026-03-24T09:00:00+09:00',
    'Competition changes should be rechecked before final recommendation.',
    true
  ),
  (
    'market-food-mangwon',
    'location_candidate',
    'market-recommendation',
    'Mangwon',
    'Solid option for casual meal concepts aiming for neighborhood repeat demand over trend visibility.',
    jsonb_build_object(
      'categoryId', 'food',
      'score', 80,
      'reasons', jsonb_build_array(
        'Repeat local demand is steadier',
        'Fits smaller-format operations',
        'Works for budget-aware first launches'
      ),
      'warnings', jsonb_build_array(
        'Tourist lift is less predictable',
        'Menu positioning should still be local-market specific'
      ),
      'meta', jsonb_build_object(
        'rentBand', 'mid',
        'competitionLevel', 'mid',
        'customerFit', 'local-repeat'
      )
    ),
    'fresh',
    '2026-03-19T09:00:00+09:00',
    '2026-03-26T09:00:00+09:00',
    'Official neighborhood review completed for local-repeat food concepts.',
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
      'market-cafe-dessert-seongsu',
      'Seoul Open Data Plaza',
      'https://data.seoul.go.kr',
      '2026-03-19T09:00:00+09:00',
      '2026-03-26T09:00:00+09:00',
      'high'
    ),
    (
      'market-cafe-dessert-mangwon',
      'Mapo District Commercial Trend Bulletin',
      'https://www.mapo.go.kr',
      '2026-03-15T09:00:00+09:00',
      '2026-03-22T09:00:00+09:00',
      'medium'
    ),
    (
      'market-cafe-dessert-konkuk',
      'Seoul Open Data Plaza',
      'https://data.seoul.go.kr',
      '2026-03-19T09:00:00+09:00',
      '2026-03-26T09:00:00+09:00',
      'high'
    ),
    (
      'market-food-yeoksam',
      'Gangnam District Business Statistics',
      'https://www.gangnam.go.kr',
      '2026-03-19T09:00:00+09:00',
      '2026-03-26T09:00:00+09:00',
      'high'
    ),
    (
      'market-food-seongsu',
      'Seoul Open Data Plaza',
      'https://data.seoul.go.kr',
      '2026-03-17T09:00:00+09:00',
      '2026-03-24T09:00:00+09:00',
      'medium'
    ),
    (
      'market-food-mangwon',
      'Mapo District Commercial Trend Bulletin',
      'https://www.mapo.go.kr',
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
