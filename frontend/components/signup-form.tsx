"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from '@/hooks/use-auth';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Check, X } from "lucide-react"

export function SignupForm() {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    university: "",
    acceptTerms: false,
  })

  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUppercase: false,
    hasLowercase: false,
    hasNumber: false,
    hasSpecial: false,
  })
  const [localError, setLocalError] = useState<string>('');
  const { register, isLoading, error } = useAuth();

  const handlePasswordChange = (password: string) => {
    setFormData({ ...formData, password })
    setPasswordStrength({
      hasMinLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    })
  }

  const getPasswordStrengthColor = () => {
    const score = Object.values(passwordStrength).filter(Boolean).length
    if (score <= 2) return "bg-destructive"
    if (score <= 3) return "bg-yellow-500"
    if (score <= 4) return "bg-accent"
    return "bg-green-500"
  }

  const getPasswordStrengthText = () => {
    const score = Object.values(passwordStrength).filter(Boolean).length
    if (score <= 2) return "Weak"
    if (score <= 3) return "Fair"
    if (score <= 4) return "Good"
    return "Strong"
  }

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    try {
      await register(formData);
      // Success! useAuth will automatically redirect to dashboard
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {(error || localError) && (
        <div className="text-red-600">{error || localError}</div>
      )}
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          placeholder="Your full name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your.email@university.edu"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="Create a strong password"
          value={formData.password}
          onChange={(e) => handlePasswordChange(e.target.value)}
          required
        />
        {formData.password && (
          <div className="space-y-2 mt-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${getPasswordStrengthColor()}`}
                  style={{ width: `${(Object.values(passwordStrength).filter(Boolean).length / 5) * 100}%` }}
                />
              </div>
              <span className="text-xs font-medium">{getPasswordStrengthText()}</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div
                className={`flex items-center gap-1 ${passwordStrength.hasMinLength ? "text-green-600" : "text-muted-foreground"}`}
              >
                {passwordStrength.hasMinLength ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                <span>8+ characters</span>
              </div>
              <div
                className={`flex items-center gap-1 ${passwordStrength.hasUppercase ? "text-green-600" : "text-muted-foreground"}`}
              >
                {passwordStrength.hasUppercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                <span>Uppercase</span>
              </div>
              <div
                className={`flex items-center gap-1 ${passwordStrength.hasLowercase ? "text-green-600" : "text-muted-foreground"}`}
              >
                {passwordStrength.hasLowercase ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                <span>Lowercase</span>
              </div>
              <div
                className={`flex items-center gap-1 ${passwordStrength.hasNumber ? "text-green-600" : "text-muted-foreground"}`}
              >
                {passwordStrength.hasNumber ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                <span>Number</span>
              </div>
              <div
                className={`flex items-center gap-1 ${passwordStrength.hasSpecial ? "text-green-600" : "text-muted-foreground"}`}
              >
                {passwordStrength.hasSpecial ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                <span>Special char</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Re-enter Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
          required
        />
        {formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-xs text-destructive">Passwords do not match</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="university">University</Label>
        <Input
          id="university"
          type="text"
          placeholder="Your university name"
          value={formData.university}
          onChange={(e) => setFormData({ ...formData, university: e.target.value })}
          required
        />
      </div>

      <div className="flex items-start gap-2">
        <Checkbox
          id="terms"
          checked={formData.acceptTerms}
          onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked as boolean })}
          required
        />
        <Label htmlFor="terms" className="text-sm font-normal leading-relaxed cursor-pointer">
          I accept the{" "}
          <a href="/terms" className="text-primary hover:underline">
            Terms and Conditions
          </a>
        </Label>
      </div>

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90"
        disabled={!formData.acceptTerms || formData.password !== formData.confirmPassword}
      >
        Create Account
      </Button>
    </form>
  )
}
