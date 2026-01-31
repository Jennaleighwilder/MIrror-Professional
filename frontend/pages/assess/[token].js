import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const phaseLabels = {
  1: 'Phase 1: Orientation Questions – Starting Reflection',
  2: 'Phase 2: Dyad Intake',
  3: 'Phase 3: Deeper Reflection – Surgical Questions',
  4: 'Phase 4: Architect Keys – Reclamation Patterns + Signal Recalibration'
};

const phaseQuestions = {
  1: [
    {
      field: 'energy_drainers',
      type: 'textarea',
      label: 'What situations or types of people do you find most draining?',
      placeholder: ''
    },
    {
      field: 'safety_template',
      type: 'textarea',
      label: 'When do you feel most at home in yourself? Describe the setting or sensation.',
      placeholder: ''
    },
    {
      field: 'pattern_repeats',
      type: 'textarea',
      label: 'What kind of patterns (emotional, relational, environmental) do you notice repeating in your life?',
      placeholder: ''
    },
    {
      field: 'inner_landscape',
      type: 'textarea',
      label: 'If your inner world was a landscape, what would it look like?',
      placeholder: ''
    },
    {
      field: 'craved_truth',
      type: 'textarea',
      label: 'What do you crave that you rarely admit out loud?',
      placeholder: ''
    },
    {
      field: 'performance_mask',
      type: 'textarea',
      label: 'Describe a moment you felt either completely invisible or overly exposed.',
      placeholder: ''
    },
    {
      field: 'irrational_calling',
      type: 'textarea',
      label: 'What’s something you’ve always felt you were meant to do—but couldn’t explain why?',
      placeholder: ''
    },
    {
      field: 'recurring_symbol',
      type: 'textarea',
      label: 'What’s one recurring dream, symbol, or image that sticks with you?',
      placeholder: ''
    },
    {
      field: 'fear_armor',
      type: 'textarea',
      label: 'What type of support do you resist—even though you might need it?',
      placeholder: ''
    },
    {
      field: 'seen_first',
      type: 'textarea',
      label: 'When someone truly sees you, what part of you do they usually notice first?',
      placeholder: ''
    }
  ],
  2: [
    {
      type: 'section',
      label: 'Geo + Logistics'
    },
    {
      field: 'geo.radius_km',
      type: 'number',
      label: 'Preferred distance radius (km)',
      placeholder: '50'
    },
    {
      field: 'geo.travel_yes',
      type: 'boolean',
      label: 'Open to travel for connection?'
    },
    {
      field: 'geo.travel_per_month',
      type: 'number',
      label: 'Trips per month you can realistically take',
      placeholder: '0'
    },
    {
      field: 'geo.availability_blocks',
      type: 'multiselect',
      label: 'Availability blocks',
      options: [
        { value: 'morning', label: 'Morning' },
        { value: 'afternoon', label: 'Afternoon' },
        { value: 'evening', label: 'Evening' },
        { value: 'overnight', label: 'Overnight' },
        { value: 'weekend', label: 'Weekend' }
      ]
    },
    {
      field: 'geo.kids_in_home',
      type: 'boolean',
      label: 'Children currently living at home?'
    },
    {
      field: 'geo.kid_ages',
      type: 'list',
      label: 'Children ages (if applicable)',
      placeholder: 'Enter ages, one per line'
    },
    {
      field: 'geo.custody_rhythm',
      type: 'text',
      label: 'Custody rhythm (if applicable)',
      placeholder: 'Week on / week off, 3-4-4-3, etc.'
    },
    {
      field: 'geo.coparent_complexity',
      type: 'select',
      label: 'Co-parenting complexity',
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' }
      ]
    },
    {
      field: 'geo.nonnegotiables',
      type: 'multiselect',
      label: 'Non‑negotiables',
      options: [
        { value: 'monogamy_model', label: 'Monogamy model' },
        { value: 'faith', label: 'Faith' },
        { value: 'substances', label: 'Substances' },
        { value: 'politics', label: 'Politics' },
        { value: 'sex_ethics', label: 'Sex ethics' },
        { value: 'health', label: 'Health' },
        { value: 'smoking', label: 'Smoking' },
        { value: 'pets', label: 'Pets' },
        { value: 'diet', label: 'Diet' },
        { value: 'finance_transparency', label: 'Finance transparency' }
      ]
    },
    {
      field: 'geo.dealbreakers',
      type: 'fixedList',
      label: 'Top 3 dealbreakers',
      count: 3,
      placeholder: 'Dealbreaker'
    },
    {
      type: 'section',
      label: 'Tempo + Lifestyle'
    },
    {
      field: 'tempo.home_nights',
      type: 'number',
      label: 'Nights at home per week',
      placeholder: '0-7'
    },
    {
      field: 'tempo.social_nights',
      type: 'number',
      label: 'Social nights per week',
      placeholder: '0-7'
    },
    {
      field: 'tempo.adventure_count',
      type: 'number',
      label: 'Adventures per month',
      placeholder: '0-5'
    },
    {
      field: 'tempo.intimacy_freq',
      type: 'select',
      label: 'Intimacy frequency preference',
      options: [
        { value: 'none', label: 'None' },
        { value: 'monthly', label: 'Monthly' },
        { value: 'weekly', label: 'Weekly' },
        { value: '2-3x_week', label: '2–3x/week' },
        { value: 'daily', label: 'Daily' }
      ]
    },
    {
      field: 'tempo.initiation_grammar',
      type: 'multiselect',
      label: 'Initiation grammar (choose up to 2)',
      options: [
        { value: 'direct', label: 'Direct' },
        { value: 'tease', label: 'Tease' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'gift', label: 'Gift' },
        { value: 'service', label: 'Service' },
        { value: 'touch', label: 'Touch' },
        { value: 'note', label: 'Note' }
      ]
    },
    {
      field: 'tempo.edges_curiosity',
      type: 'list',
      label: 'Edges: curiosity (optional)',
      placeholder: 'One per line'
    },
    {
      field: 'tempo.edges_hardno',
      type: 'list',
      label: 'Edges: hard no (optional)',
      placeholder: 'One per line'
    },
    {
      field: 'tempo.edges_sacred',
      type: 'list',
      label: 'Edges: sacred (optional)',
      placeholder: 'One per line'
    },
    {
      type: 'section',
      label: 'Nervous System'
    },
    {
      field: 'nervous.first_body_script',
      type: 'select',
      label: 'First body script when stressed',
      options: [
        { value: 'tight_chest', label: 'Tight chest' },
        { value: 'heat', label: 'Heat' },
        { value: 'numb', label: 'Numb' },
        { value: 'nausea', label: 'Nausea' },
        { value: 'tunnel', label: 'Tunnel vision' },
        { value: 'shaking', label: 'Shaking' },
        { value: 'tears', label: 'Tears' }
      ]
    },
    {
      field: 'nervous.downreg_tools',
      type: 'multiselect',
      label: 'Down‑regulation tools (choose up to 3)',
      options: [
        { value: 'alone', label: 'Time alone' },
        { value: 'walk', label: 'Walk' },
        { value: 'breath', label: 'Breath' },
        { value: 'prayer', label: 'Prayer' },
        { value: 'cold', label: 'Cold' },
        { value: 'music', label: 'Music' },
        { value: 'talk', label: 'Talk' },
        { value: 'write', label: 'Write' },
        { value: 'humor', label: 'Humor' },
        { value: 'bodywork', label: 'Bodywork' }
      ]
    },
    {
      field: 'nervous.recovery_halflife',
      type: 'select',
      label: 'Recovery half‑life after stress',
      options: [
        { value: 'minutes', label: 'Minutes' },
        { value: 'hours', label: 'Hours' },
        { value: 'one_sleep', label: 'One sleep' },
        { value: '2-3_days', label: '2–3 days' },
        { value: 'week_plus', label: 'Week+' }
      ]
    },
    {
      type: 'section',
      label: 'Attachment + Repair'
    },
    {
      field: 'attach.wobble_tendency',
      type: 'select',
      label: 'Wobble tendency under stress',
      options: [
        { value: 'withdraw', label: 'Withdraw' },
        { value: 'protest', label: 'Protest' },
        { value: 'placate', label: 'Placate' },
        { value: 'analyze_hover', label: 'Analyze / hover' },
        { value: 'freeze', label: 'Freeze' }
      ]
    },
    {
      field: 'attach.repair_sentence',
      type: 'textarea',
      label: 'Your repair sentence',
      placeholder: 'When I am ready to repair, I need...'
    },
    {
      field: 'attach.hard_boundary',
      type: 'textarea',
      label: 'Hard boundary',
      placeholder: 'A hard boundary I will not cross is...'
    },
    {
      type: 'section',
      label: 'Dyad Dynamics'
    },
    {
      field: 'dyad.activation_key',
      type: 'select',
      label: 'Activation key',
      options: [
        { value: 'comfort', label: 'Comfort' },
        { value: 'obsession', label: 'Obsession' },
        { value: 'familiarity', label: 'Familiarity' },
        { value: 'power', label: 'Power' },
        { value: 'curiosity', label: 'Curiosity' },
        { value: 'chaos', label: 'Chaos' }
      ]
    },
    {
      field: 'dyad.activation_example',
      type: 'textarea',
      label: 'Activation example',
      placeholder: 'A moment when the activation shows up...'
    },
    {
      field: 'dyad.unspoken_give',
      type: 'textarea',
      label: 'Unspoken give',
      placeholder: 'What you tend to give without asking...'
    },
    {
      field: 'dyad.unspoken_take',
      type: 'textarea',
      label: 'Unspoken take',
      placeholder: 'What you tend to take without asking...'
    },
    {
      field: 'dyad.role_locks',
      type: 'multiselect',
      label: 'Role locks you recognize',
      options: [
        { value: 'savior_wounded', label: 'Savior / Wounded' },
        { value: 'parent_child', label: 'Parent / Child' },
        { value: 'master_servant', label: 'Master / Servant' },
        { value: 'ghost_addict', label: 'Ghost / Addict' },
        { value: 'mirror_mask', label: 'Mirror / Mask' },
        { value: 'predator_pleaser', label: 'Predator / Pleaser' },
        { value: 'dreamer_anchor', label: 'Dreamer / Anchor' },
        { value: 'destroyer_martyr', label: 'Destroyer / Martyr' },
        { value: 'seducer_devourer', label: 'Seducer / Devourer' },
        { value: 'teacher_projection', label: 'Teacher / Projection' }
      ]
    },
    {
      field: 'dyad.cycle_repeats',
      type: 'textarea',
      label: 'Cycle repeats',
      placeholder: 'The cycle that repeats most often is...'
    },
    {
      field: 'dyad.cycle_starter',
      type: 'text',
      label: 'Cycle starter',
      placeholder: 'What usually starts the cycle?'
    },
    {
      field: 'dyad.cycle_conditions',
      type: 'textarea',
      label: 'Cycle conditions',
      placeholder: 'The cycle tends to trigger when...'
    },
    {
      field: 'dyad.contract_fix',
      type: 'textarea',
      label: 'Contract fix',
      placeholder: 'What you do to try to fix it...'
    },
    {
      field: 'dyad.contract_endure',
      type: 'textarea',
      label: 'Contract endure',
      placeholder: 'What you endure to keep it going...'
    },
    {
      field: 'dyad.exit_cost',
      type: 'textarea',
      label: 'Exit cost',
      placeholder: 'What it costs to leave...'
    },
    {
      field: 'dyad.exit_possible',
      type: 'textarea',
      label: 'Exit possible',
      placeholder: 'What would make exit possible...'
    },
    {
      type: 'section',
      label: 'Risk + Language'
    },
    {
      field: 'risk.redlines',
      type: 'list',
      label: 'Red lines (up to 5)',
      placeholder: 'One per line'
    },
    {
      field: 'risk.rupture_name',
      type: 'text',
      label: 'Rupture name',
      placeholder: 'What do you call the rupture?'
    },
    {
      field: 'risk.rupture_pause',
      type: 'text',
      label: 'Rupture pause',
      placeholder: 'What helps you pause during rupture?'
    },
    {
      field: 'risk.rupture_window',
      type: 'text',
      label: 'Rupture window',
      placeholder: 'What is your ideal repair window?'
    },
    {
      field: 'language.fear_line',
      type: 'text',
      label: 'Fear line',
      placeholder: 'A sentence that expresses your fear...'
    },
    {
      field: 'language.closeness_line',
      type: 'text',
      label: 'Closeness line',
      placeholder: 'A sentence that expresses your closeness need...'
    },
    {
      field: 'consent',
      type: 'boolean',
      label: 'I consent to completing this Dyad intake',
      requiredValue: true
    }
  ],
  3: [
    {
      field: 'hidden_rule',
      type: 'textarea',
      label: 'When did you first learn that love had to be earned? Was it through silence, perfection, pain, caretaking, or being chosen? What did you do to prove yourself worthy?',
      placeholder: ''
    },
    {
      field: 'pain_carved_trait',
      type: 'textarea',
      label: 'What’s a part of your identity that people admire—but don’t realize is built from pain?',
      placeholder: ''
    },
    {
      field: 'survival_promise',
      type: 'textarea',
      label: 'What would happen if you dropped the performance of strength for even one week?',
      placeholder: ''
    },
    {
      field: 'sabotage_belief',
      type: 'textarea',
      label: 'What’s the lie you tell yourself to make other people feel safe around you?',
      placeholder: ''
    },
    {
      field: 'collapsed_hope',
      type: 'textarea',
      label: 'Whose love did you keep trying to win, long after it stopped being love?',
      placeholder: ''
    },
    {
      field: 'life_split_moment',
      type: 'textarea',
      label: 'When you were most yourself as a child—what happened next?',
      placeholder: ''
    },
    {
      field: 'good_girl_belief',
      type: 'textarea',
      label: 'What do you secretly believe would happen if you stopped trying so hard to be good?',
      placeholder: ''
    },
    {
      field: 'fused_role',
      type: 'textarea',
      label: 'What did you have to become in order to stay emotionally safe?',
      placeholder: ''
    },
    {
      field: 'tired_truth',
      type: 'textarea',
      label: 'What is the most honest sentence you’ve never said out loud?',
      placeholder: ''
    },
    {
      field: 'reach_under_armor',
      type: 'textarea',
      label: 'What would someone need to say or do to finally reach the version of you hiding under all that armor?',
      placeholder: ''
    }
  ],
  4: [
    {
      field: 'unearned_inheritance',
      type: 'textarea',
      label: 'What belief about love or safety did you inherit that no longer fits—but still governs your choices?',
      placeholder: ''
    },
    {
      field: 'exiled_self',
      type: 'textarea',
      label: 'What part of yourself did you exile in order to survive? What would it take to bring them home?',
      placeholder: ''
    },
    {
      field: 'free_self',
      type: 'textarea',
      label: 'What’s the version of you who gets to be free? What do they know that you’ve forgotten?',
      placeholder: ''
    },
    {
      field: 'truth_sensation',
      type: 'textarea',
      label: 'What sensation or image feels like truth when you don’t know what to believe?',
      placeholder: ''
    },
    {
      field: 'grief_request',
      type: 'textarea',
      label: 'If your grief could speak clearly—what would it ask of you?',
      placeholder: ''
    },
    {
      field: 'held_without_fear',
      type: 'textarea',
      label: 'If someone could hold all of you without fear—what would you finally let go of?',
      placeholder: ''
    },
    {
      field: 'wildness',
      type: 'textarea',
      label: 'What does your wildness look like when it’s not punished, sedated, or sold?',
      placeholder: ''
    },
    {
      field: 'archetype',
      type: 'textarea',
      label: 'What archetype or animal represents who you are when you’re not afraid?',
      placeholder: ''
    },
    {
      field: 'healer_and_healed',
      type: 'textarea',
      label: 'If you were allowed to be both the healer and the one who needs healing—what changes?',
      placeholder: ''
    },
    {
      field: 'secret_name',
      type: 'textarea',
      label: 'If your story was a myth or legend, what’s the secret name only you would know?',
      placeholder: ''
    },
    {
      field: 'signal_reflection_1',
      type: 'textarea',
      label: 'The part of you that [______] isn’t broken. It was built to survive a place that didn’t.',
      placeholder: ''
    },
    {
      field: 'signal_reflection_2',
      type: 'textarea',
      label: 'You’re not here to be consumed. You’re here to remember.',
      placeholder: ''
    },
    {
      field: 'signal_reflection_3',
      type: 'textarea',
      label: 'Your softness isn’t a threat. It’s a portal.',
      placeholder: ''
    },
    {
      field: 'signal_reflection_4',
      type: 'textarea',
      label: 'You don’t owe anyone an explanation for the way you learned to stay alive.',
      placeholder: ''
    },
    {
      field: 'signal_reflection_5',
      type: 'textarea',
      label: 'You are not asking for too much. You are asking to stop disappearing.',
      placeholder: ''
    },
    {
      field: 'signal_reflection_6',
      type: 'textarea',
      label: 'Your gift isn’t what you became. It’s what you protected.',
      placeholder: ''
    }
  ]
};

const normalizeJson = (value) => {
  if (!value) return {};
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return {};
  }
};

const isSection = (question) => question.type === 'section';

const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc ? acc[key] : undefined), obj);
};

const setNestedValue = (obj, path, value) => {
  const keys = path.split('.');
  const next = Array.isArray(obj) ? [...obj] : { ...obj };
  let cursor = next;
  keys.forEach((key, index) => {
    if (index === keys.length - 1) {
      cursor[key] = value;
      return;
    }
    const existing = cursor[key];
    const nextLevel = existing && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...existing }
      : {};
    cursor[key] = nextLevel;
    cursor = nextLevel;
  });
  return next;
};

const mergeDeep = (base, override) => {
  if (!override || typeof override !== 'object' || Array.isArray(override)) {
    return override ?? base;
  }
  const output = { ...(base || {}) };
  Object.keys(override).forEach((key) => {
    const baseValue = base ? base[key] : undefined;
    const overrideValue = override[key];
    if (overrideValue && typeof overrideValue === 'object' && !Array.isArray(overrideValue)) {
      output[key] = mergeDeep(baseValue, overrideValue);
    } else {
      output[key] = overrideValue;
    }
  });
  return output;
};

const buildPhaseDefaults = (questions) => {
  return questions.reduce((acc, question) => {
    if (isSection(question)) return acc;
    let value = '';
    if (question.type === 'multiselect' || question.type === 'list') {
      value = [];
    } else if (question.type === 'fixedList') {
      value = Array.from({ length: question.count || 0 }, () => '');
    } else if (question.type === 'boolean') {
      value = null;
    }
    return setNestedValue(acc, question.field, value);
  }, {});
};

const isQuestionAnswered = (question, value) => {
  if (isSection(question)) return false;
  if (question.type === 'multiselect' || question.type === 'list') {
    return Array.isArray(value) && value.length > 0;
  }
  if (question.type === 'fixedList') {
    return Array.isArray(value) &&
      value.length === (question.count || 0) &&
      value.every((item) => String(item || '').trim().length > 0);
  }
  if (question.type === 'boolean') {
    if (question.requiredValue !== undefined) {
      return value === question.requiredValue;
    }
    return value === true || value === false;
  }
  if (question.type === 'number') {
    return value !== '' && value !== null && value !== undefined;
  }
  return String(value || '').trim().length > 0;
};

export default function AssessmentPortal() {
  const router = useRouter();
  const { token } = router.query;
  const [assessment, setAssessment] = useState(null);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const isDemo = token === 'demo';

  const nextPhase = useMemo(() => {
    if (!assessment) return 1;
    if (!assessment.phase1_complete) return 1;
    if (!assessment.phase2_complete) return 2;
    if (!assessment.phase3_complete) return 3;
    if (!assessment.phase4_complete) return 4;
    return 4;
  }, [assessment]);

  const fetchAssessment = async () => {
    if (!token || isDemo) return;
    try {
      const response = await axios.get(`${API_URL}/assess/${token}`);
      setAssessment(response.data);
    } catch (error) {
      setStatus(error.response?.data?.error || 'Invalid or expired assessment link.');
    }
  };

  useEffect(() => {
    if (isDemo) {
      setStatus('');
      setAssessment({
        client_first_name: 'Demo Client',
        phase1_complete: false,
        phase2_complete: false,
        phase3_complete: false,
        phase4_complete: false
      });
      return;
    }
    fetchAssessment();
  }, [token, isDemo]);

  useEffect(() => {
    if (!assessment) return;
    const phaseKey = `phase${nextPhase}_data`;
    const saved = normalizeJson(assessment[phaseKey]);
    const questionSet = phaseQuestions[nextPhase] || [];
    const defaults = buildPhaseDefaults(questionSet);
    const initial = mergeDeep(defaults, saved);
    setResponses(initial || defaults);
  }, [assessment, nextPhase]);

  const answeredCount = useMemo(() => {
    const questionSet = phaseQuestions[nextPhase] || [];
    return questionSet.filter((question) => !isSection(question))
      .filter((question) => isQuestionAnswered(question, getNestedValue(responses, question.field)))
      .length;
  }, [responses, nextPhase]);

  const totalQuestions = useMemo(() => {
    return (phaseQuestions[nextPhase] || []).filter((question) => !isSection(question)).length;
  }, [nextPhase]);

  const isPhaseComplete = useMemo(() => {
    const questionSet = phaseQuestions[nextPhase] || [];
    if (questionSet.length === 0) return false;
    return questionSet.filter((question) => !isSection(question))
      .every((question) => isQuestionAnswered(question, getNestedValue(responses, question.field)));
  }, [responses, nextPhase]);

  const handleResponseChange = (field, value) => {
    setResponses((prev) => setNestedValue(prev, field, value));
  };

  const renderQuestion = (question) => {
    if (isSection(question)) {
      return (
        <div key={question.label} className="pt-4">
          <p className="text-xs uppercase tracking-[0.3em] text-[#a67c52]">{question.label}</p>
        </div>
      );
    }

    const value = getNestedValue(responses, question.field);

    const baseInputClass = 'w-full bg-[rgba(13,10,15,0.6)] border border-[rgba(201,169,97,0.2)] rounded-xl px-4 py-3 text-[#f5f1e8] focus:border-[#c9a961] focus:outline-none';

    const renderHelper = question.helper
      ? <p className="text-xs text-[#c9a961] mt-2">{question.helper}</p>
      : null;

    let inputNode = null;

    switch (question.type) {
      case 'text':
        inputNode = (
          <input
            type="text"
            className={baseInputClass}
            value={value || ''}
            onChange={(event) => handleResponseChange(question.field, event.target.value)}
            placeholder={question.placeholder}
          />
        );
        break;
      case 'number':
        inputNode = (
          <input
            type="number"
            className={baseInputClass}
            value={value ?? ''}
            onChange={(event) => handleResponseChange(question.field, event.target.value === '' ? '' : Number(event.target.value))}
            placeholder={question.placeholder}
          />
        );
        break;
      case 'select':
        inputNode = (
          <select
            className={baseInputClass}
            value={value || ''}
            onChange={(event) => handleResponseChange(question.field, event.target.value)}
          >
            <option value="">Select an option</option>
            {(question.options || []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
        break;
      case 'boolean':
        inputNode = (
          <div className="flex flex-wrap gap-4">
            {[true, false].map((optionValue) => (
              <label key={String(optionValue)} className="flex items-center gap-2 text-[#f5f1e8] text-sm">
                <input
                  type="radio"
                  checked={value === optionValue}
                  onChange={() => handleResponseChange(question.field, optionValue)}
                />
                {optionValue ? 'Yes' : 'No'}
              </label>
            ))}
          </div>
        );
        break;
      case 'multiselect': {
        const selected = Array.isArray(value) ? value : [];
        inputNode = (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(question.options || []).map((option) => {
              const checked = selected.includes(option.value);
              return (
                <label key={option.value} className="flex items-center gap-2 text-[#f5f1e8] text-sm">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? selected.filter((item) => item !== option.value)
                        : [...selected, option.value];
                      handleResponseChange(question.field, next);
                    }}
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        );
        break;
      }
      case 'list': {
        const listValue = Array.isArray(value) ? value : [];
        inputNode = (
          <textarea
            className={`${baseInputClass} min-h-[120px]`}
            value={listValue.join('\n')}
            onChange={(event) => {
              const items = event.target.value
                .split(/\n|,/)
                .map((item) => item.trim())
                .filter((item) => item.length > 0);
              handleResponseChange(question.field, items);
            }}
            placeholder={question.placeholder}
          />
        );
        break;
      }
      case 'fixedList': {
        const listValue = Array.isArray(value) ? value : Array.from({ length: question.count || 0 }, () => '');
        inputNode = (
          <div className="space-y-3">
            {listValue.map((itemValue, index) => (
              <input
                key={`${question.field}-${index}`}
                type="text"
                className={baseInputClass}
                value={itemValue || ''}
                onChange={(event) => {
                  const next = [...listValue];
                  next[index] = event.target.value;
                  handleResponseChange(question.field, next);
                }}
                placeholder={`${question.placeholder} ${index + 1}`}
              />
            ))}
          </div>
        );
        break;
      }
      case 'textarea':
      default:
        inputNode = (
          <textarea
            className={`${baseInputClass} min-h-[140px]`}
            value={value || ''}
            onChange={(event) => handleResponseChange(question.field, event.target.value)}
            placeholder={question.placeholder}
          />
        );
        break;
    }

    return (
      <div key={question.field} className="lux-card rounded-xl p-4">
        <label className="block text-sm text-[#a67c52] mb-2">
          {question.label}
        </label>
        {inputNode}
        {renderHelper}
      </div>
    );
  };

  const handleSubmit = async () => {
    if (!token || isDemo) {
      setStatus('Demo mode only. This response is not saved.');
      return;
    }
    if (!isPhaseComplete) {
      setStatus('Please complete every question before submitting this phase.');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      await axios.post(`${API_URL}/assess/${token}/phase${nextPhase}`, {
        ...responses,
        submitted_at: new Date().toISOString()
      });
      setResponses({});
      await fetchAssessment();
      setStatus(`Submitted ${phaseLabels[nextPhase]}.`);
    } catch (error) {
      setStatus(error.response?.data?.error || 'Submission failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Mirror Professional | Assessment</title>
      </Head>
      <div className="min-h-screen px-4 py-12">
        <div className="max-w-3xl mx-auto lux-panel p-8 rounded-2xl">
          <p className="text-xs uppercase tracking-[0.3em] text-[#a67c52]">Mirror + Dyad</p>
          <h1 className="text-3xl font-serif text-[#f5f1e8] mb-2 mt-2">Private Client Assessment</h1>
          <p className="text-sm text-[#c9a961] mb-6">Secure client portal</p>

          {status && (
            <div className="mb-4 text-sm text-[#c9a961] lux-card px-3 py-2 rounded">
              {status}
            </div>
          )}

          {!assessment && !status && (
            <p className="text-[#d8d3c8]">Loading assessment...</p>
          )}

          {assessment && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="lux-card rounded-xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#a67c52]">Client</p>
                  <p className="text-lg font-serif text-[#f5f1e8] mt-2">{assessment.client_first_name || 'Client'}</p>
                </div>
                <div className="lux-card rounded-xl p-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#a67c52]">Progress</p>
                  <p className="text-lg font-serif text-[#f5f1e8] mt-2">
                    {nextPhase === 4 && assessment.phase4_complete ? 'Complete' : phaseLabels[nextPhase]}
                  </p>
                  {!assessment.phase4_complete && (
                    <p className="text-xs text-[#c9a961] mt-2">
                      {answeredCount} / {totalQuestions} questions answered
                    </p>
                  )}
                </div>
              </div>

              {assessment.phase4_complete ? (
                <div className="text-[#f5f1e8]">
                  Assessment completed. Your matchmaker will review your results shortly.
                </div>
              ) : (
                <>
                  <p className="text-sm text-[#c9a961] mb-4">
                    {phaseLabels[nextPhase]} — answer each question in your own words.
                  </p>
                  <div className="space-y-6">
                    {(phaseQuestions[nextPhase] || []).map((question) => renderQuestion(question))}
                  </div>
                  <button
                    onClick={handleSubmit}
                    disabled={loading || !isPhaseComplete}
                    className="mt-4 lux-button px-6 py-3 rounded-lg font-semibold disabled:opacity-60"
                  >
                    {isDemo ? 'Demo Only' : loading ? 'Submitting...' : 'Submit Phase'}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
