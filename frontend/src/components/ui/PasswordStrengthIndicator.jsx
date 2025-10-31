import React from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

const PasswordStrengthIndicator = ({ password }) => {
  const requirements = [
    { label: '8 أحرف على الأقل', test: (pwd) => pwd.length >= 8 },
    { label: 'حرف كبير واحد على الأقل', test: (pwd) => /[A-Z]/.test(pwd) },
    { label: 'حرف صغير واحد على الأقل', test: (pwd) => /[a-z]/.test(pwd) },
    { label: 'رقم واحد على الأقل', test: (pwd) => /[0-9]/.test(pwd) },
    { label: 'رمز خاص واحد على الأقل', test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd) },
  ];

  const metRequirements = requirements.filter(req => req.test(password));
  const strength = metRequirements.length;
  
  const getStrengthColor = () => {
    if (strength === 0) return 'bg-gray-200';
    if (strength <= 2) return 'bg-danger-500';
    if (strength <= 3) return 'bg-warning-500';
    if (strength <= 4) return 'bg-warning-400';
    return 'bg-success-500';
  };

  const getStrengthText = () => {
    if (strength === 0) return '';
    if (strength <= 2) return 'ضعيفة';
    if (strength <= 3) return 'متوسطة';
    if (strength <= 4) return 'جيدة';
    return 'قوية جداً';
  };

  const getStrengthTextColor = () => {
    if (strength === 0) return 'text-gray-500';
    if (strength <= 2) return 'text-danger-600';
    if (strength <= 3) return 'text-warning-600';
    if (strength <= 4) return 'text-warning-500';
    return 'text-success-600';
  };

  if (!password) return null;

  return (
    <div className="space-y-3 animate-slide-in-up">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">قوة كلمة المرور:</span>
        <span className={`text-sm font-bold ${getStrengthTextColor()} transition-colors duration-300`}>
          {getStrengthText()}
        </span>
      </div>
      
      <div className="flex gap-1.5 h-1.5">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`flex-1 rounded-full transition-all duration-300 ${
              level <= strength ? getStrengthColor() : 'bg-gray-200'
            }`}
            style={{
              transform: level <= strength ? 'scaleY(1.2)' : 'scaleY(1)',
            }}
          />
        ))}
      </div>

      <div className="space-y-2">
        {requirements.map((req, index) => {
          const isMet = req.test(password);
          return (
            <div
              key={index}
              className={`flex items-center gap-2 text-sm transition-all duration-200 ${
                isMet ? 'text-success-700' : 'text-gray-500'
              }`}
            >
              {isMet ? (
                <CheckCircleIcon className="w-4 h-4 text-success-500 animate-bounce-once" />
              ) : (
                <XCircleIcon className="w-4 h-4 text-gray-400" />
              )}
              <span className={isMet ? 'font-medium' : ''}>{req.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PasswordStrengthIndicator;
