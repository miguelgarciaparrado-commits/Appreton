import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://gcperiixkrrqoydfmned.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjcGVyaWl4a3JycW95ZGZtbmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NzkyMDAsImV4cCI6MjA5MDQ1NTIwMH0.M3ITmssduSTPEmX9NsxwhqnsUdiDQL9lAETt1NaoHhg';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

export function triggerExtraction(reviewId) {
  fetch(`${SUPABASE_URL}/functions/v1/extract-review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ review_id: reviewId }),
  }).catch((e) => console.warn('[Appreton] extraction trigger failed:', e.message));
}
