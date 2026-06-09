'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function SignupForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setInfo(null)

    const supabase = createClient()
    const code = inviteCode.trim()

    // 초대 코드 사전 검증 (anon이 호출 가능한 SECURITY DEFINER RPC).
    // 실제 검증/소비는 handle_new_user 트리거가 가입 시 원자적으로 처리한다.
    const { data: isValid, error: rpcError } = await supabase.rpc('is_invite_valid', {
      p_code: code,
    })

    if (rpcError) {
      setError('초대 코드를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.')
      setLoading(false)
      return
    }
    if (!isValid) {
      setError('유효하지 않은 초대 코드입니다.')
      setLoading(false)
      return
    }

    // 회원가입 — 닉네임/초대코드는 metadata로 넘기고, 트리거가 users row 생성과
    // 초대 코드 소비를 함께 처리한다. (가입 후 별도 클라이언트 업데이트 불필요)
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname: nickname.trim(), invite_code: code } },
    })

    if (signupError || !data.user) {
      // 트리거가 잘못된 초대 코드를 막으면 DB 오류로 표면화된다.
      const message = signupError?.message ?? ''
      setError(
        /invite/i.test(message) || /Database error/i.test(message)
          ? '유효하지 않은 초대 코드입니다.'
          : message || '회원가입에 실패했습니다.'
      )
      setLoading(false)
      return
    }

    // 이메일 확인이 켜져 있으면 세션이 없다 → 메일 인증 안내.
    if (!data.session) {
      setInfo('가입 신청이 완료되었습니다. 이메일을 확인해 인증을 마친 뒤 로그인해 주세요.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite">초대 코드</Label>
        <Input
          id="invite"
          value={inviteCode}
          onChange={e => setInviteCode(e.target.value)}
          required
          placeholder="가족에게 받은 초대 코드"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="nickname">닉네임</Label>
        <Input
          id="nickname"
          value={nickname}
          onChange={e => setNickname(e.target.value)}
          required
          placeholder="표시될 이름"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-email">이메일</Label>
        <Input
          id="signup-email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signup-password">비밀번호</Label>
        <Input
          id="signup-password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {info && <p className="text-sm text-primary">{info}</p>}
      <Button type="submit" className="w-full" disabled={loading || !!info}>
        {loading ? '가입 중...' : '가입하기'}
      </Button>
    </form>
  )
}
