'use client';

import { useState, useEffect, useCallback } from 'react';

interface SimpleCaptchaProps {
  onVerify: (isValid: boolean) => void;
  className?: string;
}

export default function SimpleCaptcha({ onVerify, className = '' }: SimpleCaptchaProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [isValid, setIsValid] = useState(false);
  const [error, setError] = useState('');

  // Generate new math problem
  const generateProblem = useCallback(() => {
    const newNum1 = Math.floor(Math.random() * 10) + 1;
    const newNum2 = Math.floor(Math.random() * 10) + 1;
    setNum1(newNum1);
    setNum2(newNum2);
    setUserAnswer('');
    setIsValid(false);
    setError('');
    onVerify(false);
  }, [onVerify]);

  // Initialize with first problem
  useEffect(() => {
    generateProblem();
  }, [generateProblem]);

  // Verify answer
  const handleAnswerChange = (value: string) => {
    setUserAnswer(value);
    const correctAnswer = num1 + num2;
    const userNum = parseInt(value);
    
    if (value === '') {
      setError('');
      setIsValid(false);
      onVerify(false);
    } else if (isNaN(userNum)) {
      setError('Введите число');
      setIsValid(false);
      onVerify(false);
    } else if (userNum === correctAnswer) {
      setError('');
      setIsValid(true);
      onVerify(true);
    } else {
      setError('Неверный ответ');
      setIsValid(false);
      onVerify(false);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-lg font-mono bg-gray-100 px-3 py-2 rounded border">
            {num1} + {num2} = ?
          </span>
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => handleAnswerChange(e.target.value)}
            placeholder="Ответ"
            className={`w-20 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error ? 'border-red-300' : isValid ? 'border-green-300' : 'border-gray-300'
            }`}
            maxLength={3}
          />
          {isValid && (
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <button
          type="button"
          onClick={generateProblem}
          className="text-blue-600 hover:text-blue-800 text-sm underline"
          title="Обновить задачу"
        >
          Обновить
        </button>
      </div>
      
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      
      <p className="text-xs text-gray-500">
        Решите простой пример для защиты от спама
      </p>
    </div>
  );
}