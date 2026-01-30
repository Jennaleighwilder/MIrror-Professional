import { useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

const phaseLabels = {
  1: 'Phase 1: Orientation',
  2: 'Phase 2: Deep Patterning',
  3: 'Phase 3: Architect Keys',
  4: 'Phase 4: Signal Recalibration'
};

export default function AssessmentPortal() {
  const router = useRouter();
  const { token } = router.query;
  const [assessment, setAssessment] = useState(null);
  const [notes, setNotes] = useState('');
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

  const handleSubmit = async () => {
    if (!token || isDemo) {
      setStatus('Demo mode only. This response is not saved.');
      return;
    }
    setLoading(true);
    setStatus('');
    try {
      await axios.post(`${API_URL}/assess/${token}/phase${nextPhase}`, {
        notes: notes.trim(),
        submitted_at: new Date().toISOString()
      });
      setNotes('');
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
          <p className="text-xs uppercase tracking-[0.3em] text-[#a67c52]">Mirror Protocol</p>
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
                </div>
              </div>

              {assessment.phase4_complete ? (
                <div className="text-[#f5f1e8]">
                  Assessment completed. Your matchmaker will review your results shortly.
                </div>
              ) : (
                <>
                  <label className="block text-sm text-[#a67c52] mb-2">
                    {phaseLabels[nextPhase]} Notes
                  </label>
                  <textarea
                    className="w-full min-h-[200px] bg-[rgba(13,10,15,0.6)] border border-[rgba(201,169,97,0.2)] rounded-xl px-4 py-3 text-[#f5f1e8] focus:border-[#c9a961] focus:outline-none"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    placeholder="Write your response here. This can be replaced with full question screens later."
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={loading || notes.trim().length === 0}
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
