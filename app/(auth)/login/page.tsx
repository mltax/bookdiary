'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LoginForm } from '@/components/auth/login-form'
import { SignupForm } from '@/components/auth/signup-form'

const HERO_IMAGES = ['/hero/reading-1.svg', '/hero/reading-2.svg', '/hero/reading-3.svg']

export default function LoginPage() {
  // 서버/클라이언트 마크업 불일치(hydration mismatch)를 피하기 위해
  // 첫 렌더는 고정 이미지로, 마운트 후 랜덤 이미지로 교체한다
  const [heroImage, setHeroImage] = useState(HERO_IMAGES[0])

  useEffect(() => {
    setHeroImage(HERO_IMAGES[Math.floor(Math.random() * HERO_IMAGES.length)])
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-orange-50 via-rose-50 to-amber-50 px-4 py-8">
      <Card className="w-full max-w-md overflow-hidden border-orange-100/80 shadow-xl shadow-orange-200/40">
        <div className="relative h-52 w-full overflow-hidden bg-gradient-to-br from-orange-100 via-pink-100 to-amber-100">
          <Image
            src={heroImage}
            alt="책일기 시작 화면"
            fill
            priority
            className="object-cover transition-opacity duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-black/0 to-white/10" />
          <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-orange-700 shadow-sm">
            오늘의 독서 무드 ✨
          </div>
        </div>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">📚 책일기</CardTitle>
          <p className="text-sm text-muted-foreground">가족과 함께하는 독서 일지</p>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-4">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-4">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
