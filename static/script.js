/* ─────────────────────────────────────────────
   SalaryAI — script.js
   Handles: form validation, API call, 
   result rendering, sample data, animations
───────────────────────────────────────────── */

'use strict';

/* ── DOM REFERENCES ── */
const form        = document.getElementById('salaryForm');
const predictBtn  = document.getElementById('predictBtn');
const sampleBtn   = document.getElementById('sampleBtn');
const retryBtn    = document.getElementById('retryBtn');
const formError   = document.getElementById('formError');

const stateEmpty   = document.getElementById('stateEmpty');
const stateLoading = document.getElementById('stateLoading');
const stateSuccess = document.getElementById('stateSuccess');
const stateError   = document.getElementById('stateError');

const salaryAmount    = document.getElementById('salaryAmount');
const salaryBreakdown = document.getElementById('salaryBreakdown');
const errorMessage    = document.getElementById('errorMessage');

/* ── SAMPLE DATA ── */
const SAMPLE = {
  job_title:        'Data Scientist',
  experience_years: '5',
  education_level:  'Master',
  skills_count:     '8',
  industry:         'Technology',
  company_size:     'Large',
  location:         'Bangalore',
  remote_work:      'Yes',
  certifications:   '2',
};

/* ── REQUIRED FIELDS ── */
const REQUIRED_FIELDS = [
  'job_title',
  'experience_years',
  'education_level',
  'skills_count',
  'industry',
  'company_size',
  'location',
  'remote_work',
  'certifications',
];

const NUMERIC_FIELDS = ['experience_years', 'skills_count', 'certifications'];

/* ─────────────────────────────────────────────
   STATE MANAGEMENT
───────────────────────────────────────────── */
function showState(name) {
  const states = { empty: stateEmpty, loading: stateLoading, success: stateSuccess, error: stateError };
  Object.entries(states).forEach(([key, el]) => {
    if (key === name) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}

/* ─────────────────────────────────────────────
   VALIDATION
───────────────────────────────────────────── */
function clearValidation() {
  document.querySelectorAll('.field-group.invalid').forEach(g => g.classList.remove('invalid'));
  formError.textContent = '';
  formError.classList.remove('visible');
}

function validate(data) {
  const errors = [];

  REQUIRED_FIELDS.forEach(field => {
    const val = data[field];
    if (val === null || val === undefined || String(val).trim() === '') {
      errors.push({ field, msg: `${fieldLabel(field)} is required.` });
      markInvalid(field);
    }
  });

  NUMERIC_FIELDS.forEach(field => {
    const val = parseFloat(data[field]);
    if (!isNaN(val) && val < 0) {
      errors.push({ field, msg: `${fieldLabel(field)} cannot be negative.` });
      markInvalid(field);
    }
  });

  return errors;
}

function markInvalid(fieldName) {
  const el = form.querySelector(`[name="${fieldName}"]`);
  if (el) {
    el.closest('.field-group')?.classList.add('invalid');
  }
}

function fieldLabel(name) {
  const map = {
    job_title:        'Job Title',
    experience_years: 'Experience Years',
    education_level:  'Education Level',
    skills_count:     'Skills Count',
    industry:         'Industry',
    company_size:     'Company Size',
    location:         'Location',
    remote_work:      'Remote Work',
    certifications:   'Certifications',
  };
  return map[name] || name;
}

/* ─────────────────────────────────────────────
   FORM DATA COLLECTION
───────────────────────────────────────────── */
function getFormData() {
  const fd = new FormData(form);
  const data = {};
  REQUIRED_FIELDS.forEach(f => {
    data[f] = fd.get(f) ?? '';
  });
  return data;
}

/* ─────────────────────────────────────────────
   FORMATTING HELPERS
───────────────────────────────────────────── */
function formatSalary(amount) {
  // Indian number system: e.g. 12,50,000
  const rounded = Math.round(amount);
  return new Intl.NumberFormat('en-IN').format(rounded);
}

function salaryToLPA(amount) {
  return (amount / 100000).toFixed(2);
}

function salaryToMonthly(amount) {
  return new Intl.NumberFormat('en-IN').format(Math.round(amount / 12));
}

/* ─────────────────────────────────────────────
   RESULT RENDERING
───────────────────────────────────────────── */
function renderSuccess(predicted, profileData) {
  // Animate salary amount
  salaryAmount.textContent = formatSalary(predicted);

  // Breakdown
  const monthly = salaryToMonthly(predicted);
  const lpa     = salaryToLPA(predicted);

  salaryBreakdown.innerHTML = `
    <div class="breakdown-row">
      <span class="breakdown-label">Annual (₹)</span>
      <span class="breakdown-value">₹ ${formatSalary(predicted)}</span>
    </div>
    <div class="breakdown-row">
      <span class="breakdown-label">Monthly (₹)</span>
      <span class="breakdown-value">₹ ${monthly} / mo</span>
    </div>
    <div class="breakdown-row">
      <span class="breakdown-label">Package</span>
      <span class="breakdown-value">${lpa} LPA</span>
    </div>
    <div class="breakdown-row">
      <span class="breakdown-label">Role</span>
      <span class="breakdown-value">${profileData.job_title}</span>
    </div>
  `;

  showState('success');
  scrollToResult();
}

function renderError(message) {
  errorMessage.textContent = message || 'An unexpected error occurred. Please try again.';
  showState('error');
  scrollToResult();
}

function scrollToResult() {
  document.getElementById('resultCard').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/* ─────────────────────────────────────────────
   API CALL
───────────────────────────────────────────── */
async function predictSalary(payload) {
  const response = await fetch('/predict', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

/* ─────────────────────────────────────────────
   SUBMIT HANDLER
───────────────────────────────────────────── */
async function handleSubmit(e) {
  e.preventDefault();

  clearValidation();

  const rawData = getFormData();
  const errors  = validate(rawData);

  if (errors.length > 0) {
    formError.textContent = errors[0].msg;
    formError.classList.add('visible');
    return;
  }

  // Build typed payload
  const payload = {
    job_title:        rawData.job_title.trim(),
    experience_years: parseFloat(rawData.experience_years),
    education_level:  rawData.education_level,
    skills_count:     parseInt(rawData.skills_count, 10),
    industry:         rawData.industry,
    company_size:     rawData.company_size,
    location:         rawData.location,
    remote_work:      rawData.remote_work,
    certifications:   parseInt(rawData.certifications, 10),
  };

  // Show loading
  predictBtn.disabled = true;
  showState('loading');

  try {
    const result = await predictSalary(payload);

    if (result.success) {
      renderSuccess(result.predicted_salary, payload);
    } else {
      renderError(result.error || 'Prediction failed. Please check your inputs.');
    }
  } catch (err) {
    renderError(err.message || 'Network error. Ensure the Flask backend is running.');
  } finally {
    predictBtn.disabled = false;
  }
}

/* ─────────────────────────────────────────────
   SAMPLE DATA FILLER
───────────────────────────────────────────── */
function fillSampleData() {
  clearValidation();
  showState('empty');

  Object.entries(SAMPLE).forEach(([name, value]) => {
    const el = form.querySelector(`[name="${name}"]`);
    if (!el) return;
    el.value = value;

    // Trigger a small visual effect
    el.closest('.field-group')?.classList.remove('invalid');
    el.style.transition = 'color 0.3s';
    el.style.color = 'var(--gold-light)';
    setTimeout(() => { el.style.color = ''; }, 600);
  });
}

/* ─────────────────────────────────────────────
   RESET HANDLER
───────────────────────────────────────────── */
function handleReset() {
  clearValidation();
  showState('empty');
  // native reset fires after this via the "reset" type button
}

/* ─────────────────────────────────────────────
   INPUT LIVE VALIDATION (clear errors on change)
───────────────────────────────────────────── */
function handleInputChange(e) {
  const field = e.target.closest('.field-group');
  if (field && field.classList.contains('invalid')) {
    field.classList.remove('invalid');
  }
  if (formError.classList.contains('visible') && document.querySelectorAll('.field-group.invalid').length === 0) {
    formError.textContent = '';
    formError.classList.remove('visible');
  }
}

/* ─────────────────────────────────────────────
   SMOOTH SCROLL FOR NAV LINKS
───────────────────────────────────────────── */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      const offset = 72; // nav height
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

/* ─────────────────────────────────────────────
   INTERSECTION OBSERVER — Animate cards in
───────────────────────────────────────────── */
function initScrollAnimations() {
  const targets = document.querySelectorAll('.step-card, .feature-item, .form-card, .result-card');
  if (!window.IntersectionObserver) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  targets.forEach((el, i) => {
    el.style.opacity    = '0';
    el.style.transform  = 'translateY(28px)';
    el.style.transition = `opacity 0.6s ${i * 0.07}s ease, transform 0.6s ${i * 0.07}s ease`;
    observer.observe(el);
  });
}

/* ─────────────────────────────────────────────
   NAV SCROLL SHADOW
───────────────────────────────────────────── */
function initNavScroll() {
  const nav = document.querySelector('.nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      nav.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
    } else {
      nav.style.boxShadow = 'none';
    }
  }, { passive: true });
}

/* ─────────────────────────────────────────────
   EVENT LISTENERS
───────────────────────────────────────────── */
form.addEventListener('submit', handleSubmit);
form.addEventListener('reset',  handleReset);
form.addEventListener('change', handleInputChange);
form.addEventListener('input',  handleInputChange);

sampleBtn.addEventListener('click', fillSampleData);
retryBtn.addEventListener('click', () => {
  showState('empty');
  document.querySelector('#predict').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

/* ─────────────────────────────────────────────
   INIT
───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  showState('empty');
  initScrollAnimations();
  initNavScroll();
});