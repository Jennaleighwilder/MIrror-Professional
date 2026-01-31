// matching.js - Dyad Engine + Mirror Protocol Matching Algorithm
// Adapted for the Mirror Professional backend with safe fallbacks.

/**
 * Calculate complete compatibility between two users
 * Integrates Mirror Protocol + Dyad Engine
 */
async function calculateCompatibility(userA, userB, mirrorA, mirrorB) {
  // LAYER 1: Surface Compatibility (20% weight)
  const surfaceScore = calculateSurfaceCompatibility(userA, userB);

  // LAYER 2: Attachment Compatibility (15% weight)
  const attachmentResult = calculateAttachmentCompatibility(mirrorA, mirrorB);

  // LAYER 3: Dyad Engine - Role Lock Prediction (30% weight)
  const dyadResult = predictDyadRoleLock(mirrorA, mirrorB);

  // LAYER 4: Trauma Pattern Overlap (20% weight)
  const traumaResult = calculateTraumaOverlap(mirrorA, mirrorB);

  // LAYER 5: Value & Growth Alignment (15% weight)
  const valuesScore = calculateValueAlignment(mirrorA, mirrorB);

  // Calculate weighted scores
  const dyadScore = Math.max(0, 100 - dyadResult.risk_score + (dyadResult.growth_potential * 0.2));
  const traumaScore = Math.max(0, Math.min(100, 50 + traumaResult.compatibility_modifier));

  const overallScore = Math.round(
    surfaceScore * 0.20 +
    attachmentResult.score * 0.15 +
    dyadScore * 0.30 +
    traumaScore * 0.20 +
    valuesScore * 0.15
  );

  const deepScore = Math.round(
    (attachmentResult.score + dyadScore + traumaScore + valuesScore) / 4
  );

  // Generate flags
  const flags = generateFlags(attachmentResult, dyadResult, traumaResult, valuesScore);

  // Final adjustment: Cap score if critical red flags
  const finalScore = flags.red.some(flag => flag.severity === 'critical')
    ? Math.min(overallScore, 35)
    : overallScore;

  return {
    surface_score: surfaceScore,
    deep_score: deepScore,
    overall_score: finalScore,
    breakdown: {
      surface: surfaceScore,
      attachment: attachmentResult.score,
      dyad_engine: dyadScore,
      trauma_overlap: traumaScore,
      values: valuesScore
    },
    predicted_dynamics: {
      role_lock: dyadResult.primary_role_lock,
      secondary_role_lock: dyadResult.secondary_role_lock,
      activation_probability: dyadResult.activation_probability,
      risk_level: dyadResult.risk_score,
      growth_potential: dyadResult.growth_potential,
      common_triggers: dyadResult.common_triggers,
      interventions: dyadResult.interventions
    },
    flags
  };
}

/**
 * LAYER 1: Surface Compatibility
 * Traditional dating app factors with safe fallbacks
 */
function calculateSurfaceCompatibility(userA = {}, userB = {}) {
  let score = 0;

  // Location proximity (30%)
  const distance = calculateDistance(
    userA.location_lat, userA.location_lng,
    userB.location_lat, userB.location_lng
  );
  const maxDistance = safeNumber(userA.max_distance, 50);
  const locationScore = Number.isFinite(distance)
    ? Math.max(0, 100 - (distance / maxDistance * 100))
    : 70;
  score += locationScore * 0.30;

  // Age compatibility (25%)
  const ageA = safeNumber(userA.age, null);
  const ageB = safeNumber(userB.age, null);
  const minAgeA = safeNumber(userA.min_age, null);
  const maxAgeA = safeNumber(userA.max_age, null);
  const minAgeB = safeNumber(userB.min_age, null);
  const maxAgeB = safeNumber(userB.max_age, null);

  let ageScore = 70;
  if (ageA !== null && ageB !== null) {
    const ageDiff = Math.abs(ageA - ageB);
    const ageInRange = (
      minAgeB !== null && maxAgeB !== null &&
      minAgeA !== null && maxAgeA !== null &&
      minAgeB <= ageA && ageA <= maxAgeB &&
      minAgeA <= ageB && ageB <= maxAgeA
    );
    ageScore = ageInRange ? 100 : Math.max(0, 100 - (ageDiff * 10));
  }
  score += ageScore * 0.25;

  // Interests overlap (25%) - default mid-high
  score += 70 * 0.25;

  // Lifestyle alignment (20%) - default mid
  score += 65 * 0.20;

  return Math.round(score);
}

/**
 * LAYER 2: Attachment Compatibility
 * Mirror Protocol attachment style analysis
 */
function calculateAttachmentCompatibility(mirrorA, mirrorB) {
  const compatibilityMatrix = {
    'secure-secure': 100,
    'secure-anxious': 70,
    'secure-avoidant': 75,
    'secure-fearful-avoidant': 65,
    'anxious-anxious': 50,
    'anxious-avoidant': 20,
    'anxious-fearful-avoidant': 35,
    'avoidant-avoidant': 60,
    'avoidant-fearful-avoidant': 45,
    'fearful-avoidant-fearful-avoidant': 40
  };

  const styleA = mirrorA.attachment_style || 'secure';
  const styleB = mirrorB.attachment_style || 'secure';

  const key1 = `${styleA}-${styleB}`;
  const key2 = `${styleB}-${styleA}`;

  const baseScore = compatibilityMatrix[key1] || compatibilityMatrix[key2] || 50;

  // Growth readiness bonus
  const growthBonus = (
    safeNumber(mirrorA.growth_readiness, 50) +
    safeNumber(mirrorB.growth_readiness, 50)
  ) / 200 * 20;
  const finalScore = Math.min(100, Math.round(baseScore + growthBonus));

  const riskFlags = [];

  // Anxious-Avoidant trap
  if ((styleA === 'anxious' && styleB === 'avoidant') ||
      (styleA === 'avoidant' && styleB === 'anxious')) {
    riskFlags.push({
      type: 'anxious_avoidant_trap',
      severity: 'high',
      description: 'Classic protest-withdrawal loop likely',
      recommendation: 'Require Phase 4 loop awareness before matching'
    });
  }

  // Mutual dysregulation
  if (styleA === styleB && ['anxious', 'fearful-avoidant'].includes(styleA)) {
    riskFlags.push({
      type: 'mutual_dysregulation',
      severity: 'medium',
      description: 'Both partners may struggle with regulation',
      recommendation: 'Emphasize individual therapy alongside dating'
    });
  }

  return {
    score: finalScore,
    style_a: styleA,
    style_b: styleB,
    risk_flags: riskFlags
  };
}

/**
 * LAYER 3: Dyad Engine Role Lock Prediction
 */
function predictDyadRoleLock(mirrorA, mirrorB) {
  const roleLockScores = {};

  // Extract pattern indicators from Mirror Protocol responses
  const aPatterns = extractPatternIndicators(mirrorA);
  const bPatterns = extractPatternIndicators(mirrorB);

  // 1. SAVIOR / WOUNDED
  const saviorA = countKeywords(
    [aPatterns.hidden_rule, aPatterns.pain_trait, aPatterns.survival_promise],
    ['useful', 'help', 'fix', 'save', 'rescue', 'caretaker']
  );
  const woundedB = countKeywords(
    [bPatterns.collapsed_hope, bPatterns.unearned, bPatterns.tired_truth],
    ['gave up', 'stopped hoping', 'tired', 'can\'t', 'need', 'broken']
  );
  roleLockScores.savior_wounded = (saviorA * 10) + (woundedB * 10);

  // Reverse check
  const saviorB = countKeywords(
    [bPatterns.hidden_rule, bPatterns.pain_trait, bPatterns.survival_promise],
    ['useful', 'help', 'fix', 'save', 'rescue', 'caretaker']
  );
  const woundedA = countKeywords(
    [aPatterns.collapsed_hope, aPatterns.unearned, aPatterns.tired_truth],
    ['gave up', 'stopped hoping', 'tired', 'can\'t', 'need', 'broken']
  );
  roleLockScores.savior_wounded = Math.max(
    roleLockScores.savior_wounded,
    (saviorB * 10) + (woundedA * 10)
  );

  // 2. PARENT / CHILD
  const parentA = countKeywords(
    [aPatterns.hidden_rule, aPatterns.fused_role, aPatterns.pain_trait],
    ['responsible', 'parent', 'mature', 'adult', 'take care', 'leader']
  );
  const childB = countKeywords(
    [bPatterns.safety_template, bPatterns.unearned, bPatterns.sabotage_belief],
    ['cared for', 'protected', 'chosen', 'saved', 'rescued', 'guided']
  );
  roleLockScores.parent_child = (parentA * 10) + (childB * 10);

  // Reverse
  const parentB = countKeywords(
    [bPatterns.hidden_rule, bPatterns.fused_role, bPatterns.pain_trait],
    ['responsible', 'parent', 'mature', 'adult', 'take care', 'leader']
  );
  const childA = countKeywords(
    [aPatterns.safety_template, aPatterns.unearned, aPatterns.sabotage_belief],
    ['cared for', 'protected', 'chosen', 'saved', 'rescued', 'guided']
  );
  roleLockScores.parent_child = Math.max(
    roleLockScores.parent_child,
    (parentB * 10) + (childA * 10)
  );

  // 3. PREDATOR / PLEASER
  const predatorA = countKeywords(
    [aPatterns.fear_armor, aPatterns.hidden_rule],
    ['control', 'power', 'dominate', 'manipulate', 'win', 'command']
  );
  const pleaserB = countKeywords(
    [bPatterns.fear_armor, bPatterns.hidden_rule, bPatterns.survival_promise],
    ['please', 'appease', 'avoid conflict', 'keep peace', 'make happy', 'fawn']
  );
  roleLockScores.predator_pleaser = (predatorA * 15) + (pleaserB * 15);

  // Reverse
  const predatorB = countKeywords(
    [bPatterns.fear_armor, bPatterns.hidden_rule],
    ['control', 'power', 'dominate', 'manipulate', 'win', 'command']
  );
  const pleaserA = countKeywords(
    [aPatterns.fear_armor, aPatterns.hidden_rule, aPatterns.survival_promise],
    ['please', 'appease', 'avoid conflict', 'keep peace', 'make happy', 'fawn']
  );
  roleLockScores.predator_pleaser = Math.max(
    roleLockScores.predator_pleaser,
    (predatorB * 15) + (pleaserA * 15)
  );

  // 4. GHOST / ADDICT
  const ghostA = countKeywords(
    [aPatterns.fear_armor, aPatterns.hidden_rule],
    ['isolate', 'disappear', 'withdraw', 'vanish', 'ghost', 'alone', 'distance']
  );
  const addictB = countKeywords(
    [bPatterns.fear_armor, bPatterns.sabotage_belief],
    ['cling', 'obsess', 'need', 'can\'t let go', 'consume', 'chase', 'pursue']
  );
  roleLockScores.ghost_addict = (ghostA * 12) + (addictB * 12);

  // Reverse
  const ghostB = countKeywords(
    [bPatterns.fear_armor, bPatterns.hidden_rule],
    ['isolate', 'disappear', 'withdraw', 'vanish', 'ghost', 'alone', 'distance']
  );
  const addictA = countKeywords(
    [aPatterns.fear_armor, aPatterns.sabotage_belief],
    ['cling', 'obsess', 'need', 'can\'t let go', 'consume', 'chase', 'pursue']
  );
  roleLockScores.ghost_addict = Math.max(
    roleLockScores.ghost_addict,
    (ghostB * 12) + (addictA * 12)
  );

  // 5. DESTROYER / MARTYR
  const destroyerA = countKeywords(
    [aPatterns.fear_armor, aPatterns.life_split],
    ['rage', 'destroy', 'chaos', 'break', 'explode', 'sabotage', 'burn']
  );
  const martyrB = countKeywords(
    [bPatterns.pain_trait, bPatterns.hidden_rule],
    ['endure', 'suffer', 'martyr', 'take it', 'bear', 'sacrifice', 'tolerate']
  );
  roleLockScores.destroyer_martyr = (destroyerA * 15) + (martyrB * 15);

  // 6. DREAMER / ANCHOR
  const dreamerA = countKeywords(
    [aPatterns.irrational_calling, aPatterns.inner_landscape],
    ['vision', 'create', 'imagine', 'dream', 'possibility', 'future', 'idealize']
  );
  const anchorB = countKeywords(
    [bPatterns.pain_trait, bPatterns.hidden_rule],
    ['stable', 'ground', 'practical', 'realistic', 'steady', 'foundation', 'solid']
  );
  roleLockScores.dreamer_anchor = (dreamerA * 8) + (anchorB * 8);

  // Reverse
  const dreamerB = countKeywords(
    [bPatterns.irrational_calling, bPatterns.inner_landscape],
    ['vision', 'create', 'imagine', 'dream', 'possibility', 'future', 'idealize']
  );
  const anchorA = countKeywords(
    [aPatterns.pain_trait, aPatterns.hidden_rule],
    ['stable', 'ground', 'practical', 'realistic', 'steady', 'foundation', 'solid']
  );
  roleLockScores.dreamer_anchor = Math.max(
    roleLockScores.dreamer_anchor,
    (dreamerB * 8) + (anchorA * 8)
  );

  // 7. MIRROR / MASK
  const mirrorPatternA = countKeywords(
    [aPatterns.fear_armor, aPatterns.fused_role],
    ['authentic', 'real', 'genuine', 'truth', 'vulnerable', 'exposed']
  );
  const maskB = countKeywords(
    [bPatterns.performance_mask, bPatterns.fear_armor],
    ['perform', 'mask', 'hide', 'pretend', 'act', 'facade', 'fake']
  );
  roleLockScores.mirror_mask = (mirrorPatternA * 8) + (maskB * 8);

  // 8-10: Additional patterns (simplified)
  roleLockScores.seducer_devourer = Math.min(60,
    (aPatterns.intensity || 0) + (bPatterns.intensity || 0)
  );
  roleLockScores.master_servant = Math.min(50,
    (aPatterns.control || 0) + (bPatterns.submission || 0)
  );
  roleLockScores.teacher_projection = Math.min(55,
    (aPatterns.wisdom || 0) + (bPatterns.seeking || 0)
  );

  // Determine primary role lock
  const primaryLock = Object.keys(roleLockScores).reduce((a, b) =>
    roleLockScores[a] > roleLockScores[b] ? a : b
  );

  // Find secondary (next highest)
  const sortedLocks = Object.entries(roleLockScores)
    .sort((a, b) => b[1] - a[1]);
  const secondaryLock = sortedLocks[1] ? sortedLocks[1][0] : null;

  const activationProbability = Math.min(100, roleLockScores[primaryLock]);

  // Get risk and growth data
  const riskLevels = {
    savior_wounded: { risk: 'high', growth: 'medium' },
    parent_child: { risk: 'high', growth: 'low' },
    predator_pleaser: { risk: 'critical', growth: 'low' },
    ghost_addict: { risk: 'critical', growth: 'low' },
    destroyer_martyr: { risk: 'critical', growth: 'low' },
    dreamer_anchor: { risk: 'low', growth: 'high' },
    mirror_mask: { risk: 'medium', growth: 'high' },
    seducer_devourer: { risk: 'high', growth: 'low' },
    master_servant: { risk: 'critical', growth: 'low' },
    teacher_projection: { risk: 'medium', growth: 'medium' }
  };

  const lockData = riskLevels[primaryLock] || { risk: 'medium', growth: 'medium' };

  const riskMap = { low: 20, medium: 50, high: 75, critical: 95 };
  const growthMap = { low: 25, medium: 60, high: 90 };

  let baseRisk = riskMap[lockData.risk];
  let baseGrowth = growthMap[lockData.growth];

  // Adjust for trauma load and regulation
  const traumaFactor = (
    safeNumber(mirrorA.trauma_load_score, 50) +
    safeNumber(mirrorB.trauma_load_score, 50)
  ) / 200;
  const regulationFactor = 1 - ((
    safeNumber(mirrorA.regulation_capacity, 50) +
    safeNumber(mirrorB.regulation_capacity, 50)
  ) / 200);

  const adjustedRisk = Math.min(100, Math.round(baseRisk * (1 + (traumaFactor * 0.3) + (regulationFactor * 0.3))));

  const readinessFactor = (
    safeNumber(mirrorA.growth_readiness, 50) +
    safeNumber(mirrorB.growth_readiness, 50)
  ) / 200;
  const adjustedGrowth = Math.min(100, Math.round(baseGrowth * (1 + (readinessFactor * 0.4))));

  // Common triggers by pattern
  const triggerMap = {
    savior_wounded: ['requests for help', 'expressions of need', 'showing weakness'],
    parent_child: ['need for independence', 'parental criticism', 'feeling controlled'],
    predator_pleaser: ['boundary setting', 'saying no', 'disagreement'],
    ghost_addict: ['intimacy escalation', 'requests for connection', 'vulnerability'],
    destroyer_martyr: ['conflict', 'perceived betrayal', 'abandonment fears'],
    dreamer_anchor: ['impractical plans', 'crushing of dreams', 'risk-taking'],
    mirror_mask: ['authentic expression', 'removing the mask', 'being seen'],
    seducer_devourer: ['loss of intensity', 'routine', 'emotional satiation'],
    master_servant: ['power struggles', 'equality requests', 'authority challenges'],
    teacher_projection: ['being wrong', 'student surpassing', 'challenging authority']
  };

  return {
    primary_role_lock: primaryLock,
    secondary_role_lock: secondaryLock,
    activation_probability: activationProbability,
    risk_score: adjustedRisk,
    growth_potential: adjustedGrowth,
    common_triggers: triggerMap[primaryLock] || [],
    interventions: ['Phase 4 breathing protocol', 'Pattern naming', 'Pause and reflect']
  };
}

/**
 * LAYER 4: Trauma Pattern Overlap
 */
function calculateTraumaOverlap(mirrorA, mirrorB) {
  // Extract trauma events from life_split_moment
  const traumaA = extractTraumaMarkers(mirrorA);
  const traumaB = extractTraumaMarkers(mirrorB);

  // Calculate overlap
  const overlap = calculateSetOverlap(traumaA, traumaB);
  const overlapScore = overlap * 100;

  const avgRegulation = (
    safeNumber(mirrorA.regulation_capacity, 50) +
    safeNumber(mirrorB.regulation_capacity, 50)
  ) / 2;

  let compatibilityModifier = 0;
  let mutualTriggerRisk = false;

  if (overlapScore > 70) {
    if (avgRegulation > 60) {
      compatibilityModifier = 15;
      mutualTriggerRisk = false;
    } else {
      compatibilityModifier = -25;
      mutualTriggerRisk = true;
    }
  }

  return {
    overlap_score: overlapScore,
    mutual_trigger_risk: mutualTriggerRisk,
    compatibility_modifier: compatibilityModifier
  };
}

/**
 * LAYER 5: Value & Growth Alignment
 */
function calculateValueAlignment(mirrorA, mirrorB) {
  const breakingA = JSON.stringify(mirrorA.ready_to_break || {});
  const breakingB = JSON.stringify(mirrorB.ready_to_break || {});

  const contractSimilarity = stringSimilarity(breakingA, breakingB);

  const freqA = JSON.stringify(mirrorA.current_frequency || {});
  const freqB = JSON.stringify(mirrorB.current_frequency || {});

  const frequencyAlignment = stringSimilarity(freqA, freqB);

  const dyadIntakeScore = calculateDyadIntakeAlignment(mirrorA, mirrorB);
  if (dyadIntakeScore === null) {
    return Math.round(
      (contractSimilarity * 0.5 + frequencyAlignment * 0.5) * 100
    );
  }

  const dyadRatio = dyadIntakeScore / 100;
  return Math.round(
    (contractSimilarity * 0.3 + frequencyAlignment * 0.3 + dyadRatio * 0.4) * 100
  );
}

// Helper functions
function extractPatternIndicators(mirror) {
  return {
    hidden_rule: JSON.stringify(mirror.hidden_rule || {}),
    pain_trait: JSON.stringify(mirror.pain_carved_trait || {}),
    fear_armor: JSON.stringify(mirror.fear_armor || {}),
    survival_promise: JSON.stringify(mirror.survival_promise || {}),
    collapsed_hope: JSON.stringify(mirror.collapsed_hope || {}),
    unearned: JSON.stringify(mirror.unearned_inheritance || {}),
    tired_truth: JSON.stringify(mirror.tired_truth || {}),
    fused_role: JSON.stringify(mirror.fused_role || {}),
    sabotage_belief: JSON.stringify(mirror.sabotage_belief || {}),
    safety_template: JSON.stringify(mirror.safety_template || {}),
    life_split: JSON.stringify(mirror.life_split_moment || {}),
    irrational_calling: JSON.stringify(mirror.irrational_calling || {}),
    inner_landscape: JSON.stringify(mirror.inner_landscape || {}),
    performance_mask: JSON.stringify(mirror.performance_mask || {})
  };
}

function countKeywords(textFields, keywords) {
  let count = 0;
  for (const field of textFields) {
    const text = String(field || '').toLowerCase();
    for (const keyword of keywords) {
      if (text.includes(keyword.toLowerCase())) {
        count++;
      }
    }
  }
  return count;
}

function extractTraumaMarkers(mirror) {
  const text = JSON.stringify(mirror.life_split_moment || {}).toLowerCase();
  const markers = [];

  const traumaTypes = [
    'abuse', 'abandonment', 'neglect', 'assault', 'death', 'divorce',
    'violence', 'betrayal', 'illness', 'accident', 'loss'
  ];

  for (const type of traumaTypes) {
    if (text.includes(type)) {
      markers.push(type);
    }
  }

  return markers;
}

function calculateSetOverlap(setA, setB) {
  if (setA.length === 0 || setB.length === 0) return 0;

  const intersection = setA.filter(item => setB.includes(item)).length;
  const union = new Set([...setA, ...setB]).size;

  return intersection / union;
}

function stringSimilarity(str1, str2) {
  if (str1 === str2) return 1;
  if (str1.length === 0 || str2.length === 0) return 0;

  const words1 = str1.toLowerCase().split(/\W+/);
  const words2 = str2.toLowerCase().split(/\W+/);

  const common = words1.filter(word => words2.includes(word)).length;
  const total = new Set([...words1, ...words2]).size;

  return total === 0 ? 0 : common / total;
}

function calculateDyadIntakeAlignment(mirrorA = {}, mirrorB = {}) {
  const geoA = mirrorA.geo || {};
  const geoB = mirrorB.geo || {};
  const tempoA = mirrorA.tempo || {};
  const tempoB = mirrorB.tempo || {};
  const dyadA = mirrorA.dyad || {};
  const dyadB = mirrorB.dyad || {};

  const availabilityScore = overlapScore(geoA.availability_blocks, geoB.availability_blocks);
  const nonnegotiablesScore = overlapScore(geoA.nonnegotiables, geoB.nonnegotiables);
  const initiationScore = overlapScore(tempoA.initiation_grammar, tempoB.initiation_grammar);
  const roleLockScore = overlapScore(dyadA.role_locks, dyadB.role_locks);
  const intimacyScore = intimacyAlignmentScore(tempoA.intimacy_freq, tempoB.intimacy_freq);

  const scores = [availabilityScore, nonnegotiablesScore, initiationScore, roleLockScore, intimacyScore]
    .filter((value) => Number.isFinite(value));

  if (scores.length === 0) return null;

  const total = scores.reduce((sum, value) => sum + value, 0);
  return Math.round(total / scores.length);
}

function overlapScore(listA, listB) {
  const a = Array.isArray(listA) ? listA : [];
  const b = Array.isArray(listB) ? listB : [];
  if (a.length === 0 || b.length === 0) return null;
  const intersection = a.filter((item) => b.includes(item)).length;
  const union = new Set([...a, ...b]).size;
  if (union === 0) return null;
  return Math.round((intersection / union) * 100);
}

function intimacyAlignmentScore(freqA, freqB) {
  if (!freqA || !freqB) return null;
  const order = ['none', 'monthly', 'weekly', '2-3x_week', 'daily'];
  const indexA = order.indexOf(freqA);
  const indexB = order.indexOf(freqB);
  if (indexA === -1 || indexB === -1) return null;
  const diff = Math.abs(indexA - indexB);
  return Math.max(0, 100 - diff * 20);
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) {
    return Number.NaN;
  }
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees) {
  return degrees * Math.PI / 180;
}

function generateFlags(attachmentResult, dyadResult, traumaResult, valuesScore) {
  const redFlags = [];
  const yellowFlags = [];
  const greenLights = [];

  // RED FLAGS
  if (dyadResult.risk_score >= 90) {
    redFlags.push({
      type: 'critical_role_lock',
      severity: 'critical',
      description: `High probability of ${dyadResult.primary_role_lock.replace(/_/g, ' / ')} pattern`,
      recommendation: 'Not recommended - exit support ready if needed'
    });
  }

  if (traumaResult.mutual_trigger_risk) {
    redFlags.push({
      type: 'mutual_trauma_trigger',
      severity: 'high',
      description: 'Overlapping trauma with low regulation capacity',
      recommendation: 'Individual therapy required before dating'
    });
  }

  redFlags.push(...attachmentResult.risk_flags.filter(flag => flag.severity === 'high'));

  // YELLOW FLAGS
  if (dyadResult.risk_score >= 60 && dyadResult.risk_score < 90) {
    yellowFlags.push({
      type: 'moderate_role_lock',
      severity: 'medium',
      description: `${dyadResult.primary_role_lock.replace(/_/g, ' / ')} pattern may activate`,
      recommendation: 'Monitor closely, interventions ready'
    });
  }

  if (traumaResult.overlap_score > 70 && !traumaResult.mutual_trigger_risk) {
    yellowFlags.push({
      type: 'trauma_bond_potential',
      severity: 'medium',
      description: 'High trauma similarity - could bond or trigger',
      recommendation: 'Ensure both are in therapy/healing'
    });
  }

  // GREEN LIGHTS
  if (attachmentResult.style_a === 'secure' && attachmentResult.style_b === 'secure') {
    greenLights.push({
      type: 'secure_attachment',
      description: 'Both have secure attachment - strong foundation'
    });
  }

  if (dyadResult.growth_potential >= 80) {
    greenLights.push({
      type: 'high_growth_potential',
      description: 'This pairing could facilitate significant growth'
    });
  }

  if (valuesScore >= 80) {
    greenLights.push({
      type: 'aligned_evolution',
      description: 'You\'re moving in the same direction'
    });
  }

  return { red: redFlags, yellow: yellowFlags, green: greenLights };
}

function safeNumber(value, fallback) {
  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

module.exports = {
  calculateCompatibility,
  predictDyadRoleLock
};
