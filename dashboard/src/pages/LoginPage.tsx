import { BrandMark } from '@/components/shared/BrandMark'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores'
import { authService, type AuthMethods } from '@/services/auth.service'
import {
  authCapabilityErrorMessage,
  buildOidcStartUrl,
  loginErrorMessage,
  oidcErrorMessage,
  safeReturnPath,
  withoutOidcError,
} from '@/features/auth/login-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

function readSessionValue(key: string): string {
  try {
    return window.sessionStorage.getItem(key) || ''
  } catch {
    return ''
  }
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [username, setUsername] = useState(() => window.localStorage.getItem('runvara_last_username') || '')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [capsLock, setCapsLock] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [oidcError, setOidcError] = useState(() => oidcErrorMessage(location.search))
  const [authMethods, setAuthMethods] = useState<AuthMethods | null>(null)
  const [authMethodsLoading, setAuthMethodsLoading] = useState(true)
  const [authMethodsError, setAuthMethodsError] = useState('')
  const [authMethodsAttempt, setAuthMethodsAttempt] = useState(0)
  const [sessionNotice] = useState(() => readSessionValue('runvara_auth_notice'))
  const [storedReturnTo] = useState(() => readSessionValue('runvara_return_to'))
  const login = useAuthStore((s) => s.login)
  const from = (location.state as { from?: { pathname?: string; search?: string; hash?: string } } | null)?.from
  const locationReturnTo = from?.pathname ? `${from.pathname}${from.search || ''}${from.hash || ''}` : ''
  const returnTo = safeReturnPath(locationReturnTo) || safeReturnPath(storedReturnTo) || '/dashboard'
  const passwordEnabled = authMethods?.passwordEnabled === true
  const offerPasswordRecovery = Boolean(authMethodsError)
  const showPasswordLogin = passwordEnabled || offerPasswordRecovery
  const oidcEnabled = authMethods?.oidc.enabled === true && !!authMethods.oidc.startUrl.trim()

  useEffect(() => {
    try {
      window.sessionStorage.removeItem('runvara_auth_notice')
      window.sessionStorage.removeItem('runvara_return_to')
    } catch {
      // Session storage can be unavailable in hardened browser contexts.
    }
  }, [])

  useEffect(() => {
    let active = true
    authService.getMethods()
      .then((methods) => {
        if (!active) return
        setAuthMethods(methods)
        setAuthMethodsLoading(false)
      })
      .catch((probeError: unknown) => {
        if (!active) return
        setAuthMethods(null)
        setAuthMethodsError(authCapabilityErrorMessage(probeError))
        setAuthMethodsLoading(false)
      })
    return () => {
      active = false
    }
  }, [authMethodsAttempt])

  useEffect(() => {
    const message = oidcErrorMessage(location.search)
    if (!message) return

    navigate({
      pathname: location.pathname,
      search: withoutOidcError(location.search),
      hash: location.hash,
    }, { replace: true, state: location.state })
  }, [location.hash, location.pathname, location.search, location.state, navigate])

  const handleOidcLogin = () => {
    if (!oidcEnabled || !authMethods) return
    try {
      window.location.assign(buildOidcStartUrl(authMethods.oidc.startUrl, returnTo, window.location.origin))
    } catch {
      setOidcError('企业单点登录暂不可用，请联系管理员。')
    }
  }

  const handleOidcRecovery = () => {
    try {
      window.location.assign(buildOidcStartUrl('/admin/auth/oidc/start', returnTo, window.location.origin))
    } catch {
      setOidcError('企业单点登录恢复入口暂不可用，请联系管理员。')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('请输入用户名和密码')
      return
    }

    setLoading(true)
    setError('')

    try {
      await login(username.trim(), password)
      window.localStorage.setItem('runvara_last_username', username.trim())
      navigate(returnTo, { replace: true })
    } catch (loginError) {
      setError(loginErrorMessage(loginError))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-8 sm:px-8">
      <Card className="w-full max-w-[460px] px-6 py-8 sm:px-10 sm:py-10">
        <CardHeader className="p-0 pb-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <BrandMark className="h-8 w-8" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold tracking-tight">Runvara AI Gateway</p>
              <p className="text-xs text-muted-foreground">智能模型路由网关</p>
            </div>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">登录控制台</h1>
          <p className="text-sm text-muted-foreground">使用组织账户进入受治理网关</p>
        </CardHeader>

        <CardContent className="p-0">
          {sessionNotice && (
            <div role="status" className="mb-5 border-l-2 border-warning-text/30 bg-warning-soft px-3 py-2.5 text-xs leading-5 text-warning-text">
              {sessionNotice}
            </div>
          )}
          {oidcError && (
            <div id="oidc-login-error" role="alert" aria-live="polite" className="mb-5 border-l-2 border-destructive-text/30 bg-destructive-soft px-3 py-2.5 text-xs leading-5 text-destructive-text">
              {oidcError}
            </div>
          )}
          {authMethodsLoading && (
            <div role="status" className="mb-5 flex items-center gap-2 border-l-2 border-border bg-muted px-3 py-2.5 text-xs leading-5 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              正在确认当前实例启用的登录方式…
            </div>
          )}
          {authMethodsError && !authMethodsLoading && (
            <div role="alert" className="mb-5 border-l-2 border-warning-text/30 bg-warning-soft px-3 py-2.5 text-xs leading-5 text-warning-text">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p>{authMethodsError}</p>
                  <p className="mt-1 text-warning-text">下方密码入口仅作为恢复尝试，并不表示服务端已启用密码登录；若实例只启用 SSO，该尝试会被拒绝。</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 border-warning-text/30 bg-card text-warning-text bg-card"
                  onClick={() => {
                    setAuthMethodsLoading(true)
                    setAuthMethodsError('')
                    setAuthMethodsAttempt((attempt) => attempt + 1)
                  }}
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  重新探测
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 border-warning-text/30 bg-card text-warning-text bg-card"
                  onClick={handleOidcRecovery}
                >
                  <Fingerprint className="h-3.5 w-3.5" />
                  尝试 SSO
                </Button>
              </div>
            </div>
          )}
          {oidcEnabled && (
            <div className={showPasswordLogin ? 'mb-5' : ''}>
              <Button
                type="button"
                size="lg"
                onClick={handleOidcLogin}
                className="h-11 w-full"
              >
                <Fingerprint className="h-4 w-4" />
                {authMethods?.oidc.label.trim() || '企业单点登录'}
              </Button>
              {showPasswordLogin && (
                <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground" aria-hidden="true">
                  <div className="h-px flex-1 bg-muted" />
                  <span>或使用密码</span>
                  <div className="h-px flex-1 bg-muted" />
                </div>
              )}
            </div>
          )}
          {showPasswordLogin && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-xs font-medium text-muted-foreground">用户名</Label>
                <div className="relative">
                  <UserRound className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    autoComplete="username"
                    autoFocus={!username}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'login-error' : undefined}
                    className="h-11 bg-card pl-9 pr-4"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">密码</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                    onKeyUp={(e) => setCapsLock(e.getModifierState('CapsLock'))}
                    disabled={loading}
                    autoComplete="current-password"
                    autoFocus={!!username}
                    aria-invalid={!!error}
                    aria-describedby={error ? 'login-error' : capsLock ? 'caps-lock-warning' : undefined}
                    className="h-11 bg-card pl-9 pr-12"
                  />
                  <button
                    type="button"
                    className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? '隐藏密码' : '显示密码'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {capsLock && (
                  <p id="caps-lock-warning" className="text-xs text-warning-text">大写锁定已开启</p>
                )}
                {error && (
                  <p id="login-error" role="alert" aria-live="polite" className="border-l-2 border-destructive-text/30 bg-destructive-soft px-3 py-2.5 text-xs leading-5 text-destructive-text">
                    {error}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                size="lg"
                aria-busy={loading}
                className="mt-2 h-11 w-full"
                disabled={loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? '正在登录…' : '登录'}
              </Button>
              <p className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                连接当前实例 · 安全会话鉴权
              </p>
            </form>
          )}
          {!authMethodsLoading && !authMethodsError && !passwordEnabled && !oidcEnabled && (
            <p role="status" className="rounded-lg border border-warning-text/30 bg-warning-soft px-3 py-3 text-center text-xs leading-5 text-warning-text">
              当前实例未启用可用的登录方式，请联系管理员。
            </p>
          )}
          {!passwordEnabled && oidcEnabled && (
            <p className="mt-4 text-center text-xs text-muted-foreground">将通过企业身份提供方完成安全认证</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
