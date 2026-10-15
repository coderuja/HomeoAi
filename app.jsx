/* ============================================================
   HomeoAI Clinical Station: Patient Intake (Step 1 + Step 2)
   Frontend only. No backend, no API.

   SETUP (run once in your terminal):
     npm create vite@latest homeoai -- --template react
     cd homeoai
     npm install
     npm install tailwindcss @tailwindcss/vite lucide-react

   1) vite.config.js  -> add the Tailwind plugin:
        import tailwindcss from "@tailwindcss/vite";
        export default defineConfig({ plugins: [react(), tailwindcss()] });

   2) src/index.css   -> delete everything, put only this line:
        @import "tailwindcss";

   3) Copy THIS file's contents into src/App.jsx, then:  npm run dev
   ============================================================ */

import { useState } from "react";
import {
  Activity, Stethoscope, UserPlus, RefreshCw, Users, User,
  FileText, Sparkles, Camera, Check, ArrowRight, ArrowLeft,
} from "lucide-react";

/* ------------------------------------------------------------
   DATA: plain arrays/objects kept OUTSIDE components.
   Edit these to change labels without touching the layout.
   ------------------------------------------------------------ */

// The 4 steps shown in the stepper bar
const STEPS = [
  { id: 1, label: "Basic Info", icon: User },
  { id: 2, label: "Chief Complaint", icon: FileText },
  { id: 3, label: "Family & Miasm", icon: Sparkles },
  { id: 4, label: "Clinical Photo", icon: Camera },
];

// Quick-add chips under the complaint box (Step 2)
const MODALITIES = [
  "Sunlight / Summer heat",
  "Night (bed warmth)",
  "Cold damp weather",
  "Mental stress / Worry",
  "Dark quiet room",
  "Motion / Walking",
  "Rest / Lying down",
];

// "Pre-fill" demo buttons at the top right (handy for demos)
const PREFILLS = [
  {
    label: "Sun Headache",
    data: {
      complaint: "Severe throbbing headache across forehead and temples whenever exposed to direct sunlight.",
      duration: "3 weeks", worse: "Sun, heat", better: "Dark room, cold bath",
    },
  },
  {
    label: "Eczema Skin",
    data: {
      complaint: "Dry, itchy, cracked patches on elbows and behind the knees, worse at night.",
      duration: "6 months", worse: "Night, bed warmth", better: "Cold air",
    },
  },
  {
    label: "Alopecia",
    data: {
      complaint: "Round patches of hair loss on the scalp, started after a period of stress.",
      duration: "2 months", worse: "Mental stress, worry", better: "Rest",
    },
  },
];

// Starting values of the form. Every input reads from this object.
const EMPTY_FORM = {
  name: "", age: "", gender: "Male", phone: "", email: "",
  complaint: "", duration: "", worse: "", better: "",
};

/* ------------------------------------------------------------
   Reusable Tailwind class strings, so we don't repeat them.
   ------------------------------------------------------------ */
const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm " +
  "text-slate-800 placeholder:text-slate-400 focus:border-cyan-700 " +
  "focus:outline-none focus:ring-2 focus:ring-cyan-700/20";

/* ============================================================
   SMALL COMPONENT: Field
   A label + input wrapper. "children" is whatever you put
   between <Field> ... </Field> (an input, select, etc.).
   Props: label text, whether it's required, and an error text.
   ============================================================ */
function Field({ label, required, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {hint && <span className="text-xs text-slate-400">{hint}</span>}
      </div>
      {children}
      {/* Only shows when an error string exists */}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

/* ============================================================
   COMPONENT: Header
   Logo, the Doctor/Patient toggle, case counter.
   "view" and "setView" come from App (props).
   ============================================================ */
function Header({ view, setView, totalCases }) {
  const tab = (id, text, Icon) => (
    <button
      onClick={() => setView(id)}
      className={
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium " +
        (view === id ? "bg-white text-cyan-800 shadow-sm" : "text-slate-600")
      }
    >
      <Icon size={16} /> {text}
    </button>
  );

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        {/* Logo block */}
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-cyan-700 text-white">
            <Activity size={20} />
          </div>
          <div>
            <p className="font-semibold text-slate-900">HomeoAI Clinical Station</p>
            <p className="text-xs text-slate-500">Kent Repertory &amp; Miasmatic Intelligence</p>
          </div>
        </div>

        {/* Toggle between the two portals */}
        <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {tab("doctor", "Doctor Workstation", Stethoscope)}
          {tab("patient", "Patient Intake Portal", UserPlus)}
        </div>

        <div className="flex items-center gap-4 text-sm text-slate-600">
          <RefreshCw size={16} />
          <span className="flex items-center gap-1.5">
            <Users size={16} /> Total Cases: <b className="text-slate-900">{totalCases}</b>
          </span>
        </div>
      </div>
    </header>
  );
}

/* ============================================================
   COMPONENT: Stepper
   The 4 boxes. For each step we decide its status:
     step.id <  current  -> done   (green tick)
     step.id === current -> active (teal highlight)
     step.id >  current  -> locked (grey)
   Clicking is allowed only on finished steps (go back).
   ============================================================ */
function Stepper({ current, goTo }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {STEPS.map(({ id, label, icon: Icon }) => {
        const done = id < current;
        const active = id === current;

        const box = active
          ? "border-cyan-700 bg-cyan-50"
          : done
          ? "border-emerald-300 bg-emerald-50"
          : "border-slate-200 bg-white";
        const badge = active
          ? "bg-cyan-700 text-white"
          : done
          ? "bg-emerald-600 text-white"
          : "bg-slate-100 text-slate-500";

        return (
          <button
            key={id}                       // React needs a unique key in lists
            type="button"
            disabled={!done}               // only finished steps are clickable
            onClick={() => goTo(id)}
            className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left ${box}`}
          >
            <span className={`grid h-9 w-9 place-items-center rounded-lg ${badge}`}>
              {done ? <Check size={18} /> : <Icon size={18} />}
            </span>
            <span>
              <span className="block text-xs text-slate-500">Step {id}</span>
              <span className="block text-sm font-semibold text-slate-800">{label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================
   STEP 1: Basic Info
   Props:
     form    -> the whole form object (read values from it)
     update  -> function that runs on every keystroke
     errors  -> { fieldName: "message" } for validation
   Each input is "controlled": value comes from state and
   onChange writes back to state. That is the core React idea.
   ============================================================ */
function Step1({ form, update, errors }) {
  return (
    <>
      <h2 className="text-xl font-bold text-slate-900">Step 1: Patient Demographic &amp; Contact</h2>
      <p className="mb-5 mt-1 border-b border-slate-100 pb-4 text-sm text-slate-500">
        Essential details for clinical indexing and case record.
      </p>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Full Name" required error={errors.name}>
          <input
            name="name"                     // must match the key in `form`
            value={form.name}
            onChange={update}
            placeholder="e.g. Eleanor Vance"
            className={inputClass}
          />
        </Field>

        <Field label="Age (Years)" required error={errors.age}>
          <input
            name="age" type="number" min="0" max="120"
            value={form.age} onChange={update}
            placeholder="e.g. 34"
            className={inputClass}
          />
        </Field>

        <Field label="Biological Gender" required>
          <select name="gender" value={form.gender} onChange={update} className={inputClass}>
            <option>Male</option>
            <option>Female</option>
            <option>Other</option>
          </select>
        </Field>

        <Field label="Phone Number" error={errors.phone}>
          <input
            name="phone" type="tel"
            value={form.phone} onChange={update}
            placeholder="e.g. +91 98765 43210"
            className={inputClass}
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Email Address" error={errors.email}>
            <input
              name="email" type="email"
              value={form.email} onChange={update}
              placeholder="e.g. patient@domain.com"
              className={inputClass}
            />
          </Field>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   STEP 2: Chief Complaint & Modalities
   Extra prop: addModality(text) -> appends a chip's text into
   the "Worse From" box.
   ============================================================ */
function Step2({ form, update, errors, addModality }) {
  return (
    <>
      <h2 className="text-xl font-bold text-slate-900">Step 2: Chief Complaint &amp; Modalities</h2>
      <p className="mb-5 mt-1 border-b border-slate-100 pb-4 text-sm text-slate-500">
        Detail the primary ailment in the patient&apos;s own words for Kent rubric matching.
      </p>

      <div className="grid gap-5">
        <Field
          label="Chief Complaint (Free Text)" required error={errors.complaint}
          hint="Describe sensations, location & onset"
        >
          <textarea
            name="complaint" rows={4}
            value={form.complaint} onChange={update}
            placeholder="e.g. Severe throbbing headache across forehead and temples whenever exposed to direct sunlight outdoors..."
            className={inputClass}
          />
        </Field>

        <div className="grid gap-5 md:grid-cols-3">
          <Field label="Duration of Complaint">
            <input
              name="duration" value={form.duration} onChange={update}
              placeholder="e.g. 3 weeks, 6 months" className={inputClass}
            />
          </Field>
          <Field label={<>Aggravations <span className="text-orange-600">(Worse From)</span></>}>
            <input
              name="worse" value={form.worse} onChange={update}
              placeholder="e.g. Sun, heat, night, cold air" className={inputClass}
            />
          </Field>
          <Field label={<>Ameliorations <span className="text-emerald-600">(Better From)</span></>}>
            <input
              name="better" value={form.better} onChange={update}
              placeholder="e.g. Dark room, cold bath, rest" className={inputClass}
            />
          </Field>
        </div>

        {/* Quick-add chips */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <p className="mb-3 text-xs font-semibold text-slate-600">
            Click to quickly add common modalities:
          </p>
          <div className="flex flex-wrap gap-2">
            {MODALITIES.map((m) => (
              <button
                type="button"             // stops the button from submitting the form
                key={m}
                onClick={() => addModality(m)}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-700 hover:border-cyan-700 hover:text-cyan-800"
              >
                + {m}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ============================================================
   COMPONENT: IntakePortal  (the "brain" of the page)
   Owns ALL the state:
     step   -> which step is showing (1..4)
     form   -> everything the user typed
     errors -> validation messages
   Child components only receive these through props.
   ============================================================ */
function IntakePortal() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});

  // Runs on every keystroke in any input.
  // e.target.name = the input's name, e.target.value = what was typed.
  // [e.target.name]: ... is a "computed key": updates only that field.
  const update = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" }); // clear its error while typing
  };

  // Chip click: add text to "Worse From" without duplicating it
  const addModality = (text) => {
    if (form.worse.includes(text)) return;
    setForm({ ...form, worse: form.worse ? `${form.worse}, ${text}` : text });
  };

  // Pre-fill buttons: merge demo data into the form
  const prefill = (data) => {
    setForm({ ...form, ...data });
    setErrors({});
  };

  // Check the current step's fields. Returns true if all OK.
  const validate = () => {
    const e = {};
    if (step === 1) {
      if (!form.name.trim()) e.name = "Enter the patient's full name.";
      if (!form.age) e.age = "Enter the patient's age.";
      else if (form.age < 0 || form.age > 120) e.age = "Enter an age between 0 and 120.";
      if (form.phone && !/^[+\d\s-]{7,15}$/.test(form.phone))
        e.phone = "Enter a valid phone number.";
      if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
        e.email = "Enter a valid email address.";
    }
    if (step === 2) {
      if (!form.complaint.trim()) e.complaint = "Describe the main complaint.";
    }
    setErrors(e);
    return Object.keys(e).length === 0; // no errors -> true
  };

  const next = (ev) => {
    ev.preventDefault();               // stop the browser reloading the page
    if (validate()) setStep(step + 1);
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      {/* Title + prefill chips */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="max-w-md">
          <h1 className="text-3xl font-bold text-slate-900">Patient Clinical Intake</h1>
          <p className="mt-1 text-sm text-slate-500">
            Multi-step holistic case taking with generational miasm mapping and clinical photography.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <span className="flex items-center gap-1"><Sparkles size={14} /> Pre-fill:</span>
          {PREFILLS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => prefill(p.data)}
              className="rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-1.5 text-cyan-800"
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <Stepper current={step} goTo={setStep} />

      {/* The white card. onSubmit fires when the Continue button is pressed. */}
      <form onSubmit={next} className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {/* Show the component that matches the current step */}
        {step === 1 && <Step1 form={form} update={update} errors={errors} />}
        {step === 2 && (
          <Step2 form={form} update={update} errors={errors} addModality={addModality} />
        )}
        {step >= 3 && (
          <p className="py-10 text-center text-slate-500">
            Step {step} is coming next. Steps 1 and 2 are complete.
          </p>
        )}

        {/* Footer buttons */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-2 text-sm text-slate-600"
            >
              <ArrowLeft size={16} /> Back
            </button>
          ) : (
            <span />   // empty spacer keeps "Continue" on the right
          )}

          {step < 4 && (
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-cyan-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800"
            >
              Continue to {STEPS[step].label} <ArrowRight size={16} />
            </button>
          )}
        </div>
      </form>
    </main>
  );
}

/* ============================================================
   ROOT COMPONENT: App
   Holds the top-level view (doctor/patient) and shows the
   header plus the right page below it.
   ============================================================ */
export default function App() {
  const [view, setView] = useState("patient");

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Header view={view} setView={setView} totalCases={0} />
      {view === "patient" ? (
        <IntakePortal />
      ) : (
        <p className="p-10 text-center text-slate-500">Doctor Workstation: build this next.</p>
      )}
    </div>
  );
}