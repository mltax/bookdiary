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
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()

    // 초대 코드 검증
    const { data: invite } = await supabase
      .from('invite_codes')
      .select('id')
      .eq('code', inviteCode)
      .is('used_by', null)
      .single()

    if (!invite) {
      setError('유효하지 않은 초대 코드입니다.')
      setLoading(false)
      return
    }

    // 회원가입
    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nickname } },
    })

    if (signupError || !data.user) {
      setError(signupError?.message ?? '회원가입에 실패했습니다.')
      setLoading(false)
      return
    }

    // 닉네임 업데이트 (handle_new_user 트리거가 먼저 생성한 row 업데이트)
    await supabase
      .from('users')
      .update({ nickname })
      .eq('id', data.user.id)

    // 초대 코드 사용 처리
    await supabase
      .from('invite_codes')
      .update({ used_by: data.user.id, used_at: new Date().toISOString() })
      .eq('id', invite.id)

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
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? '가입 중...' : '가입하기'}
      </Button>
    </form>
  )
}
