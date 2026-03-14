import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const GITHUB_API = 'https://api.github.com'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

export async function POST(req: NextRequest) {
  try {
    const { projectId, repoName } = await req.json()
    if (!projectId) return NextResponse.json({ error: 'projectId requerido' }, { status: 400 })

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    // Get founder's GitHub token
    const { data: integration } = await supabase
      .from('user_integrations')
      .select('access_token, github_login')
      .eq('user_id', user.id)
      .eq('provider', 'github')
      .single()
    if (!integration) {
      return NextResponse.json({ error: 'GitHub no conectado. Conecta tu cuenta primero.' }, { status: 400 })
    }
    const { access_token: token, github_login: login } = integration

    // Verify ownership and get project name
    const { data: project } = await supabase
      .from('projects')
      .select('id, name, github_repo')
      .eq('id', projectId)
      .eq('user_id', user.id)
      .single()
    if (!project) return NextResponse.json({ error: 'Proyecto no encontrado' }, { status: 404 })

    if (project.github_repo) {
      return NextResponse.json({ ok: true, repo: project.github_repo, alreadyExists: true })
    }

    // Determine repo name using founder's login
    const name = repoName?.trim() || slugify(project.name)
    const fullRepo = `${login}/${name}`

    // Create repo (no auto_init — we push a custom README)
    const createRes = await fetch(`${GITHUB_API}/user/repos`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        description: `Proyecto creado con Reason — ${project.name}`,
        private: true,
        auto_init: false,
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.json()
      // If repo already exists, just use it
      if (err.errors?.[0]?.message?.includes('already exists')) {
        await supabase.from('projects').update({ github_repo: fullRepo }).eq('id', projectId)
        return NextResponse.json({ ok: true, repo: fullRepo, alreadyExists: true })
      }
      return NextResponse.json({ error: err.message || 'Error creando repo' }, { status: 400 })
    }

    // Push custom README as initial commit
    const readmeContent = `# ${project.name}\n\nGenerado por Reason — sistema de creación de proyectos\n`
    await fetch(`${GITHUB_API}/repos/${fullRepo}/contents/README.md`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: `init: project ${project.name} created`,
        content: Buffer.from(readmeContent).toString('base64'),
      }),
    })

    // Save to project
    await supabase.from('projects').update({ github_repo: fullRepo }).eq('id', projectId)

    return NextResponse.json({ ok: true, repo: fullRepo })
  } catch (err) {
    console.error('[github/init]', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
