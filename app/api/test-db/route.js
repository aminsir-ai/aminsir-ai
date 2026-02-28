import { supabase } from '@/lib/supabase'

export async function GET() {
  const { data, error } = await supabase
    .from('students')
    .select('*')

  if (error) {
    return new Response(JSON.stringify({ error }), { status: 500 })
  }

  return new Response(JSON.stringify({ data }), { status: 200 })
}