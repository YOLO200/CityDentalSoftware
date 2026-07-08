import { useState, useCallback, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { useProfiles } from "../admin/primitives";
import {
  SPageHeader, SFormCard, SInput, SSelect, STextarea, SColorInput, SUploadBox,
  SToggle, STable, SModal, SBadge, SActionRow, NewButton, SaveButton, ResetBtn, fmtDate,
} from "./primitives";

const TIMEZONES = ["Asia/Kolkata","Asia/Dubai","Asia/Singapore","Europe/London","America/New_York"];
const CURRENCIES = ["INR (₹)","USD ($)","AED (د.إ)","GBP (£)","EUR (€)"];
const DATE_FORMATS = ["DD/MM/YYYY","MM/DD/YYYY","YYYY-MM-DD"];
const LANGUAGES = ["English","Hindi","Gujarati","Marathi","Tamil","Telugu"];
const COUNTRIES = ["India","UAE","USA","UK","Canada","Australia"];
const STATES = ["Gujarat","Maharashtra","Rajasthan","Karnataka","Tamil Nadu","Delhi","Telangana"];

// ─── Clinic Profile ───────────────────────────────────────────────────────────

export function ClinicProfile() {
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fName,       setFName]       = useState("");
  const [fTagline,    setFTagline]    = useState("");
  const [fRegNo,      setFRegNo]      = useState("");
  const [fGST,        setFGST]        = useState("");
  const [fWebsite,    setFWebsite]    = useState("");
  const [fEmail,      setFEmail]      = useState("");
  const [fPhone,      setFPhone]      = useState("");
  const [fEmergency,  setFEmergency]  = useState("");
  const [fAddr1,      setFAddr1]      = useState("");
  const [fAddr2,      setFAddr2]      = useState("");
  const [fCity,       setFCity]       = useState("");
  const [fState,      setFState]      = useState(STATES[0]);
  const [fZip,        setFZip]        = useState("");
  const [fCountry,    setFCountry]    = useState("India");
  const [fTimezone,   setFTimezone]   = useState(TIMEZONES[0]);
  const [fCurrency,   setFCurrency]   = useState(CURRENCIES[0]);
  const [fDateFmt,    setFDateFmt]    = useState(DATE_FORMATS[0]);
  const [fLang,       setFLang]       = useState("English");
  const [fPrimary,    setFPrimary]    = useState("#1e2d5a");
  const [fSecondary,  setFSecondary]  = useState("#f97316");

  useEffect(() => {
    supabase.from("clinic_settings").select("key, value").then(({ data }) => {
      if (!data) return;
      const m: Record<string, string> = Object.fromEntries(data.map(r => [r.key, r.value ?? ""]));
      if (m.clinic_name)      setFName(m.clinic_name);
      if (m.tagline)          setFTagline(m.tagline);
      if (m.reg_number)       setFRegNo(m.reg_number);
      if (m.gst_number)       setFGST(m.gst_number);
      if (m.website)          setFWebsite(m.website);
      if (m.email)            setFEmail(m.email);
      if (m.phone)            setFPhone(m.phone);
      if (m.emergency_phone)  setFEmergency(m.emergency_phone);
      if (m.address_line1)    setFAddr1(m.address_line1);
      if (m.address_line2)    setFAddr2(m.address_line2);
      if (m.city)             setFCity(m.city);
      if (m.state)            setFState(m.state);
      if (m.zip_code)         setFZip(m.zip_code);
      if (m.country)          setFCountry(m.country);
      if (m.timezone)         setFTimezone(m.timezone);
      if (m.currency)         setFCurrency(m.currency);
      if (m.date_format)      setFDateFmt(m.date_format);
      if (m.language)         setFLang(m.language);
      if (m.primary_color)    setFPrimary(m.primary_color);
      if (m.secondary_color)  setFSecondary(m.secondary_color);
    });
  }, []);

  const save = async () => {
    if (!fName) { setError("Clinic Name is required."); return; }
    setSaving(true); setError(null);
    const entries = [
      { key: "clinic_name",    value: fName },
      { key: "tagline",        value: fTagline },
      { key: "reg_number",     value: fRegNo },
      { key: "gst_number",     value: fGST },
      { key: "website",        value: fWebsite },
      { key: "email",          value: fEmail },
      { key: "phone",          value: fPhone },
      { key: "emergency_phone",value: fEmergency },
      { key: "address_line1",  value: fAddr1 },
      { key: "address_line2",  value: fAddr2 },
      { key: "city",           value: fCity },
      { key: "state",          value: fState },
      { key: "zip_code",       value: fZip },
      { key: "country",        value: fCountry },
      { key: "timezone",       value: fTimezone },
      { key: "currency",       value: fCurrency },
      { key: "date_format",    value: fDateFmt },
      { key: "language",       value: fLang },
      { key: "primary_color",  value: fPrimary },
      { key: "secondary_color",value: fSecondary },
    ];
    const { error: err } = await supabase.from("clinic_settings")
      .upsert(entries.map(e => ({ ...e, updated_at: new Date().toISOString() })), { onConflict: "key" });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSuccess(true); setTimeout(() => setSuccess(false), 2500);
  };

  return (
    <div>
      <SPageHeader title="Clinic Profile" subtitle="Manage your clinic's basic information and branding" />
      {error   && <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-600">{error}</div>}
      {success && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">Settings saved successfully.</div>}

      <SFormCard title="Basic Information">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <SInput label="Clinic Name"         value={fName}      onChange={setFName}      required className="md:col-span-2" />
          <SInput label="Tagline"             value={fTagline}   onChange={setFTagline} />
          <SInput label="Registration Number" value={fRegNo}     onChange={setFRegNo} />
          <SInput label="GST / VAT Number"    value={fGST}       onChange={setFGST} />
          <SInput label="Website"             value={fWebsite}   onChange={setFWebsite}   placeholder="https://..." />
          <SInput label="Email"               value={fEmail}     onChange={setFEmail}     type="email" />
          <SInput label="Phone"               value={fPhone}     onChange={setFPhone} />
          <SInput label="Emergency Phone"     value={fEmergency} onChange={setFEmergency} />
        </div>
      </SFormCard>

      <SFormCard title="Address">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <SInput label="Address Line 1" value={fAddr1}   onChange={setFAddr1}  className="col-span-2 md:col-span-3" />
          <SInput label="Address Line 2" value={fAddr2}   onChange={setFAddr2}  className="col-span-2 md:col-span-3" />
          <SInput label="City"           value={fCity}    onChange={setFCity} />
          <SSelect label="State"         options={STATES} value={fState}    onChange={setFState} />
          <SInput label="ZIP Code"       value={fZip}     onChange={setFZip} />
          <SSelect label="Country"       options={COUNTRIES} value={fCountry} onChange={setFCountry} />
        </div>
      </SFormCard>

      <SFormCard title="Branding">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SUploadBox label="Clinic Logo"  hint="PNG, SVG — 512×512 recommended" />
          <SUploadBox label="Favicon"      hint="ICO, PNG — 32×32 px" />
          <SColorInput label="Primary Color"   value={fPrimary}   onChange={setFPrimary} />
          <SColorInput label="Secondary Color" value={fSecondary} onChange={setFSecondary} />
        </div>
      </SFormCard>

      <SFormCard title="Regional Settings">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <SSelect label="Timezone"    options={TIMEZONES}    value={fTimezone}  onChange={setFTimezone} />
          <SSelect label="Currency"    options={CURRENCIES}   value={fCurrency}  onChange={setFCurrency} />
          <SSelect label="Date Format" options={DATE_FORMATS} value={fDateFmt}   onChange={setFDateFmt} />
          <SSelect label="Language"    options={LANGUAGES}    value={fLang}      onChange={setFLang} />
        </div>
      </SFormCard>

      <SActionRow onSave={save} onReset={() => {}} saving={saving} />
    </div>
  );
}

// ─── Branches / Centers ───────────────────────────────────────────────────────

export function Branches() {
  const profiles = useProfiles();
  const [rows,    setRows]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  const [fName,    setFName]    = useState("");
  const [fAddress, setFAddress] = useState("");
  const [fPhone,   setFPhone]   = useState("");
  const [fEmail,   setFEmail]   = useState("");
  const [fHours,   setFHours]   = useState("09:00 – 18:00");
  const [fManager, setFManager] = useState("");
  const [fActive,  setFActive]  = useState(true);

  const managerMap = Object.fromEntries(profiles.map(p => [p.name, p.id]));

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("branches").select("*").order("name");
    setRows(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditing(null); setFName(""); setFAddress(""); setFPhone(""); setFEmail("");
    setFHours("09:00 – 18:00"); setFManager(""); setFActive(true); setError(null);
    setModal(true);
  };
  const openEdit = (r: any) => {
    setEditing(r); setFName(r.name ?? ""); setFAddress(r.address ?? ""); setFPhone(r.phone ?? "");
    setFEmail(r.email ?? ""); setFHours(r.working_hours ?? ""); setFManager(r.manager ?? "");
    setFActive(r.status !== "Inactive"); setError(null); setModal(true);
  };

  const save = async () => {
    if (!fName) { setError("Branch name is required."); return; }
    setSaving(true); setError(null);
    const payload = { name: fName, address: fAddress || null, phone: fPhone || null, email: fEmail || null, working_hours: fHours || null, manager: fManager || null, status: fActive ? "Active" : "Inactive" };
    const { error: err } = editing
      ? await supabase.from("branches").update(payload).eq("id", editing.id)
      : await supabase.from("branches").insert(payload);
    if (err) { setError(err.message); setSaving(false); return; }
    setSaving(false); setModal(false); load();
  };

  const deactivate = async (id: string, current: string) => {
    await supabase.from("branches").update({ status: current === "Active" ? "Inactive" : "Active" }).eq("id", id);
    load();
  };

  return (
    <div>
      <SPageHeader title="Branches / Centers" rightSlot={<NewButton onClick={openAdd} label="+ Add Branch" />} />
      <STable loading={loading}
        columns={["Center Name","Address","Phone","Manager","Status","Actions"]}
        rows={rows.map(r => [
          <span className="font-medium">{r.name}</span>,
          r.address ?? "—", r.phone ?? "—", r.manager ?? "—",
          <SBadge status={r.status ?? "Active"} />,
          <div className="flex gap-1">
            <button onClick={() => openEdit(r)} className="text-[10px] border border-gray-200 rounded px-2 py-0.5 hover:bg-gray-50">Edit</button>
            <button onClick={() => deactivate(r.id, r.status ?? "Active")}
              className={`text-[10px] border rounded px-2 py-0.5 ${r.status === "Active" ? "border-amber-200 text-amber-600 hover:bg-amber-50" : "border-green-200 text-green-600 hover:bg-green-50"}`}>
              {r.status === "Active" ? "Disable" : "Enable"}
            </button>
          </div>,
        ])}
      />

      <SModal title={editing ? "Edit Branch" : "Add Branch"} open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          {error && <p className="text-xs text-red-500">{error}</p>}
          <SInput  label="Branch Name"    value={fName}    onChange={setFName}    required />
          <SInput  label="Address"        value={fAddress} onChange={setFAddress} />
          <div className="grid grid-cols-2 gap-3">
            <SInput label="Phone"         value={fPhone}   onChange={setFPhone} />
            <SInput label="Email"         value={fEmail}   onChange={setFEmail}   type="email" />
          </div>
          <SInput  label="Working Hours"  value={fHours}   onChange={setFHours}   placeholder="09:00 – 18:00" />
          <SSelect label="Manager"        options={["Select Manager", ...profiles.map(p => p.name)]} value={fManager} onChange={setFManager} />
          <SToggle label="Active"         checked={fActive} onChange={setFActive} />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={save} loading={saving} label={editing ? "UPDATE" : "CREATE"} />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Clinic Timings ───────────────────────────────────────────────────────────

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

export function ClinicTimings() {
  const [timings, setTimings] = useState<Record<string, { open: string; close: string; closed: boolean }>>(
    Object.fromEntries(DAYS.map(d => [d, { open: "09:00", close: "18:00", closed: d === "Sunday" }]))
  );
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const update = (day: string, field: "open" | "close" | "closed", val: string | boolean) => {
    setTimings(prev => ({ ...prev, [day]: { ...prev[day], [field]: val } }));
  };

  const save = async () => {
    setSaving(true);
    const entries = DAYS.map(d => ({ key: `timing_${d.toLowerCase()}`, value: JSON.stringify(timings[d]), updated_at: new Date().toISOString() }));
    await supabase.from("clinic_settings").upsert(entries, { onConflict: "key" });
    setSaving(false); setSuccess(true); setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <div>
      <SPageHeader title="Clinic Timings" subtitle="Set working hours for each day of the week" />
      {success && <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-xs text-green-600">Timings saved.</div>}
      <SFormCard>
        <div className="space-y-2">
          {DAYS.map(day => (
            <div key={day} className="flex items-center gap-4 py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm font-medium text-gray-700 w-28">{day}</span>
              <SToggle label="" checked={!timings[day].closed} onChange={v => update(day, "closed", !v)} />
              {!timings[day].closed && (
                <>
                  <input type="time" value={timings[day].open} onChange={e => update(day, "open", e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-[#1e2d5a]" />
                  <span className="text-xs text-gray-400">to</span>
                  <input type="time" value={timings[day].close} onChange={e => update(day, "close", e.target.value)}
                    className="border border-gray-300 rounded px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-[#1e2d5a]" />
                </>
              )}
              {timings[day].closed && <span className="text-xs text-red-400 font-medium">CLOSED</span>}
            </div>
          ))}
        </div>
        <SActionRow onSave={save} onReset={() => {}} saving={saving} />
      </SFormCard>
    </div>
  );
}

// ─── Holidays ─────────────────────────────────────────────────────────────────

export function Holidays() {
  const [rows,   setRows]   = useState([
    { date: "26 Jan 2026", name: "Republic Day",      type: "National" },
    { date: "15 Aug 2026", name: "Independence Day",  type: "National" },
    { date: "02 Oct 2026", name: "Gandhi Jayanti",    type: "National" },
    { date: "25 Dec 2026", name: "Christmas",         type: "Optional" },
  ]);
  const [modal, setModal] = useState(false);
  const [fDate, setFDate] = useState("");
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState("National");

  const add = () => {
    if (!fDate || !fName) return;
    setRows(prev => [...prev, { date: fDate, name: fName, type: fType }]);
    setModal(false); setFDate(""); setFName("");
  };

  return (
    <div>
      <SPageHeader title="Holidays" rightSlot={<NewButton onClick={() => setModal(true)} label="+ Add Holiday" />} />
      <STable
        columns={["Date","Holiday Name","Type","Actions"]}
        rows={rows.map((r, i) => [
          r.date, <span className="font-medium">{r.name}</span>,
          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${r.type === "National" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{r.type}</span>,
          <button onClick={() => setRows(prev => prev.filter((_, j) => j !== i))} className="text-[10px] text-red-400 hover:underline">Remove</button>,
        ])}
      />
      <SModal title="Add Holiday" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          <SInput  label="Holiday Name" value={fName} onChange={setFName} required />
          <SInput  label="Date"         value={fDate} onChange={setFDate} type="date" />
          <SSelect label="Type"         options={["National","Optional","Festival"]} value={fType} onChange={setFType} />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={add} label="ADD" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Departments ──────────────────────────────────────────────────────────────

export function Departments() {
  const [rows, setRows]   = useState(["General Dentistry","Orthodontics","Endodontics","Periodontics","Oral Surgery","Cosmetic Dentistry"].map(n => ({ name: n, status: "Active" })));
  const [modal, setModal] = useState(false);
  const [fName, setFName] = useState("");

  return (
    <div>
      <SPageHeader title="Departments" rightSlot={<NewButton onClick={() => setModal(true)} label="+ Add Department" />} />
      <STable
        columns={["Department Name","Status","Actions"]}
        rows={rows.map((r, i) => [
          <span className="font-medium">{r.name}</span>,
          <SBadge status={r.status} />,
          <button onClick={() => setRows(prev => prev.filter((_, j) => j !== i))} className="text-[10px] text-red-400 hover:underline">Remove</button>,
        ])}
      />
      <SModal title="Add Department" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          <SInput label="Department Name" value={fName} onChange={setFName} required />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={() => { if (fName) { setRows(p => [...p, { name: fName, status: "Active" }]); setModal(false); setFName(""); } }} label="ADD" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}

// ─── Rooms & Chairs ───────────────────────────────────────────────────────────

export function RoomsChairs() {
  const [rows, setRows]   = useState([
    { name: "Room 1 — Chair A", type: "Consultation", status: "Active" },
    { name: "Room 1 — Chair B", type: "Consultation", status: "Active" },
    { name: "Room 2 — Chair A", type: "Surgery",      status: "Active" },
    { name: "Room 3 — Chair A", type: "X-Ray",        status: "Inactive" },
  ]);
  const [modal, setModal] = useState(false);
  const [fName, setFName] = useState("");
  const [fType, setFType] = useState("Consultation");

  return (
    <div>
      <SPageHeader title="Rooms & Chairs" rightSlot={<NewButton onClick={() => setModal(true)} label="+ Add Room / Chair" />} />
      <STable
        columns={["Name","Type","Status","Actions"]}
        rows={rows.map((r, i) => [
          <span className="font-medium">{r.name}</span>,
          r.type, <SBadge status={r.status} />,
          <button onClick={() => setRows(p => p.filter((_, j) => j !== i))} className="text-[10px] text-red-400 hover:underline">Remove</button>,
        ])}
      />
      <SModal title="Add Room / Chair" open={modal} onClose={() => setModal(false)}>
        <div className="space-y-3">
          <SInput  label="Room / Chair Name" value={fName} onChange={setFName} required placeholder="e.g. Room 4 — Chair A" />
          <SSelect label="Type"              options={["Consultation","Surgery","X-Ray","Lab","Sterilization"]} value={fType} onChange={setFType} />
          <div className="flex gap-3 pt-3 border-t border-gray-100">
            <SaveButton onClick={() => { if (fName) { setRows(p => [...p, { name: fName, type: fType, status: "Active" }]); setModal(false); setFName(""); } }} label="ADD" />
            <ResetBtn onClick={() => setModal(false)} />
          </div>
        </div>
      </SModal>
    </div>
  );
}
