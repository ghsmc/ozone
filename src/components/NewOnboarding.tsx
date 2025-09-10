import React, { useState } from 'react';
import { useDarkMode } from '../contexts/DarkModeContext';
import { supabase, OnboardingData } from '../lib/supabase';
import { Loader2 } from 'lucide-react';

interface NewOnboardingProps {
  onComplete: (profileData: OnboardingData) => void;
  onBypass?: () => void;
}

const NewOnboarding: React.FC<NewOnboardingProps> = ({ onComplete, onBypass }) => {
  const { isDarkMode } = useDarkMode();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState<OnboardingData>({
    full_name: '',
    graduation_year: new Date().getFullYear(),
    major: '',
    gpa: undefined,
    preferred_locations: [],
    preferred_industries: [],
    preferred_company_sizes: [],
    work_model_preference: 'any',
     salary_expectation_min: undefined,
    salary_expectation_max: undefined,
    skills: [],
    interests: [],
    career_goals: ''
  });

  const steps = [
    {
      title: 'Welcome to Milo',
      subtitle: 'Your AI career discovery platform',
      component: WelcomeStep
    },
    {
      title: 'Basic Information',
      subtitle: 'Tell us about yourself',
      component: BasicInfoStep
    },
    {
      title: 'Your Interests',
      subtitle: 'What excites you?',
      component: InterestsStep
    },
    {
      title: 'Career Goals',
      subtitle: 'What do you want to achieve?',
      component: GoalsStep
    },
    {
      title: 'Complete',
      subtitle: 'Ready to discover opportunities',
      component: CompleteStep
    }
  ];

  const updateFormData = (updates: Partial<OnboardingData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    console.log('=== NEXT CLICKED ===');
    console.log('Current step:', currentStep);
    console.log('Total steps:', steps.length);
    
    if (currentStep < steps.length - 1) {
      console.log('Moving to next step');
      setCurrentStep(currentStep + 1);
    } else {
      console.log('Already on last step, not moving');
    }
  };

  const handleBack = () => {
    console.log('=== BACK CLICKED ===');
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    saveProfileToSupabase();
  };

  const saveProfileToSupabase = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Create user profile in Supabase
      const profileData = {
        ...formData,
        id: crypto.randomUUID(),
        email: `${formData.full_name.toLowerCase().replace(/\s+/g, '.')}@yale.edu`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('Saving profile to Supabase:', profileData);

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw new Error(error.message);
      }

      console.log('Profile saved successfully:', data);
      onComplete(profileData);
    } catch (error) {
      console.error('Error saving profile:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CurrentStepComponent = steps[currentStep].component;
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col justify-center px-8">
        <div className="max-w-lg mx-auto w-full">
          {/* Layered Logo */}
          <div className="flex items-center justify-center mb-16">
            <div className="relative w-12 h-12 flex items-center justify-center">
              {/* Layer 3 - Outer ring */}
              <div className="absolute w-20 h-20 bg-red-900/20 opacity-100 scale-100"
                   style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              {/* Layer 2 - Middle ring */}
              <div className="absolute w-16 h-16 bg-red-800/40 opacity-100 scale-100"
                   style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              {/* Layer 1 - Inner ring */}
              <div className="absolute w-12 h-12 bg-red-700/60 opacity-100 scale-100"
                   style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
              {/* Core logo */}
              <div className="absolute w-12 h-12 bg-red-600 opacity-100 scale-100 flex items-center justify-center"
                   style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}>
                <span className="text-white text-xl font-black">人</span>
              </div>
            </div>
          </div>

          {/* Step Title */}
          <div className="text-center mb-16">
            <h1 className="text-4xl font-light tracking-tight mb-4 text-white">
              {steps[currentStep].title}
            </h1>
            <p className="text-lg font-light text-gray-400">
              {steps[currentStep].subtitle}
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-16">
            <CurrentStepComponent 
              formData={formData}
              updateFormData={updateFormData}
              isDarkMode={isDarkMode}
            />
          </div>

          {/* Progress Dots */}
          <div className="flex justify-center mb-8">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentStep 
                      ? 'bg-red-600' 
                      : index < currentStep 
                        ? 'bg-red-600/50' 
                        : 'bg-gray-800'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded-lg">
              <p className="text-red-200 text-sm">{submitError}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleBack}
              disabled={isFirstStep || isSubmitting}
              className={`px-6 py-3 font-medium transition-all duration-200 ${
                isFirstStep || isSubmitting
                  ? 'text-gray-800 cursor-not-allowed'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Back
            </button>
            
            {onBypass && (
              <button
                onClick={onBypass}
                className="px-4 py-2 text-gray-600 hover:text-gray-400 font-medium transition-all duration-200 text-sm"
              >
                Skip
              </button>
            )}
            
            <button
              onClick={isLastStep ? handleComplete : handleNext}
              disabled={!isStepValid() || isSubmitting}
              className={`flex items-center gap-2 px-8 py-3 font-medium transition-all duration-200 rounded-lg ${
                !isStepValid() || isSubmitting
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : isLastStep ? (
                'Complete Setup'
              ) : (
                'Continue'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
const WelcomeStep: React.FC<{
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
  isDarkMode: boolean;
}> = () => {
  return (
    <div className="text-center">
      <p className="text-xl text-gray-300 font-light leading-relaxed">
        We'll help you discover amazing career opportunities tailored just for you.
      </p>
      <div className="mt-8 space-y-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
          <span className="text-gray-400">Personalized job matching</span>
        </div>
        <div className="flex items-center justify-center space-x-3">
          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
          <span className="text-gray-400">AI-powered opportunity discovery</span>
        </div>
        <div className="flex items-center justify-center space-x-3">
          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
          <span className="text-gray-400">Yale network connections</span>
        </div>
      </div>
    </div>
  );
};

const BasicInfoStep: React.FC<{
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
  isDarkMode: boolean;
}> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Full Name
        </label>
        <input
          type="text"
          value={formData.full_name}
          onChange={(e) => updateFormData({ full_name: e.target.value })}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-white rounded-lg focus:border-red-600 focus:outline-none"
          placeholder="Enter your full name"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Graduation Year
        </label>
        <select
          value={formData.graduation_year}
          onChange={(e) => updateFormData({ graduation_year: parseInt(e.target.value) })}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-white rounded-lg focus:border-red-600 focus:outline-none"
        >
          {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i).map(year => (
            <option key={year} value={year}>{year}</option>
          ))}
        </select>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Major
        </label>
        <input
          type="text"
          value={formData.major}
          onChange={(e) => updateFormData({ major: e.target.value })}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-white rounded-lg focus:border-red-600 focus:outline-none"
          placeholder="e.g., Computer Science, Economics"
        />
      </div>
    </div>
  );
};

const InterestsStep: React.FC<{
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
  isDarkMode: boolean;
}> = ({ formData, updateFormData }) => {
  const industries = [
    'Technology', 'Finance', 'Consulting', 'Healthcare', 'Education',
    'Government', 'Non-profit', 'Media', 'Real Estate', 'Energy'
  ];

  const toggleIndustry = (industry: string) => {
    const current = formData.preferred_industries || [];
    const updated = current.includes(industry)
      ? current.filter(i => i !== industry)
      : [...current, industry];
    updateFormData({ preferred_industries: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-4">
          Select industries that interest you
        </label>
        <div className="grid grid-cols-2 gap-3">
          {industries.map(industry => (
            <button
              key={industry}
              onClick={() => toggleIndustry(industry)}
              className={`px-4 py-3 rounded-lg border transition-all duration-200 ${
                formData.preferred_industries?.includes(industry)
                  ? 'bg-red-600 border-red-600 text-white'
                  : 'bg-gray-900 border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              {industry}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const GoalsStep: React.FC<{
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
  isDarkMode: boolean;
}> = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Career Goals
        </label>
        <textarea
          value={formData.career_goals}
          onChange={(e) => updateFormData({ career_goals: e.target.value })}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-800 text-white rounded-lg focus:border-red-600 focus:outline-none h-32 resize-none"
          placeholder="What do you want to achieve in your career?"
        />
      </div>
    </div>
  );
};

const CompleteStep: React.FC<{
  formData: OnboardingData;
  updateFormData: (updates: Partial<OnboardingData>) => void;
  isDarkMode: boolean;
}> = ({ formData }) => {
  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-white text-2xl">✓</span>
      </div>
      <h3 className="text-xl font-semibold text-white mb-4">
        You're all set!
      </h3>
      <p className="text-gray-400 mb-6">
        We've gathered your information and are ready to show you personalized opportunities.
      </p>
      <div className="bg-gray-900 rounded-lg p-4 text-left">
        <h4 className="text-sm font-medium text-gray-300 mb-2">Your Profile:</h4>
        <div className="text-sm text-gray-400 space-y-1">
          <div>Name: {formData.full_name}</div>
          <div>Graduation: {formData.graduation_year}</div>
          <div>Major: {formData.major}</div>
          <div>Interests: {formData.preferred_industries?.join(', ')}</div>
        </div>
      </div>
    </div>
  );
};

export default NewOnboarding;