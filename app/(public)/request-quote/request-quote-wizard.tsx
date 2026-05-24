"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { servicePriceLabel } from "@/lib/services/display";
import { submitQuoteRequest } from "./actions";
import { RequestAddressFields } from "./request-address-fields";

export type WizardServiceOption = {
  id: string;
  question_id: string;
  label: string;
  value: string;
  price_modifier: number | string | null;
  duration_modifier_minutes: number | null;
  risk_modifier: string | null;
  requires_parent_approval: boolean | null;
  active?: boolean | null;
  sort_order: number | null;
};

export type WizardServiceQuestion = {
  id: string;
  service_id: string;
  question_text: string;
  question_type: "single_choice" | "multi_choice" | "yes_no" | "short_text" | "number";
  required: boolean;
  help_text: string | null;
  sort_order: number | null;
  service_question_options: WizardServiceOption[];
};

export type WizardService = {
  id: string;
  name: string;
  public_description: string | null;
  service_type: string;
  pricing_type: string;
  base_price: number | null;
  min_price: number | null;
  max_price: number | null;
  unit_label: string | null;
  customer_visible_range: string | null;
  requires_photos: boolean;
  requires_parent_approval: boolean;
  requires_site_review: boolean;
  estimated_duration_minutes?: number | null;
  default_crew_size?: number | null;
  upsell_service_ids: string[];
  questions: WizardServiceQuestion[];
};

type AnswerState = Record<string, string | string[]>;
type NotesState = Record<string, string>;

const stepLabels = ["Address", "Services", "Details", "Contact"];
const maxPhotoBytes = 20 * 1024 * 1024;
const maxTotalPhotoBytes = 35 * 1024 * 1024;
const supportedPhotoExtensions = new Set(["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "avif"]);

function serviceBadge(type: string) {
  if (type === "add_on") return "Add-on";
  if (type === "case_by_case") return "Review needed";
  return "Core";
}

function toArray(value: string | string[] | undefined) {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function RequestQuoteWizard({ services, initialServiceId, apiKey, error }: { services: WizardService[]; initialServiceId?: string; apiKey?: string | null; error?: string }) {
  const initialSelection = initialServiceId && services.some((service) => service.id === initialServiceId) ? [initialServiceId] : [];
  const [step, setStep] = useState(initialSelection.length ? 1 : 0);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(initialSelection);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [notes, setNotes] = useState<NotesState>({});
  const [photoServiceIds, setPhotoServiceIds] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const selectedServices = useMemo(() => services.filter((service) => selectedServiceIds.includes(service.id)), [selectedServiceIds, services]);
  const coreServices = services.filter((service) => service.service_type === "core");
  const selectedUpsellIds = new Set(selectedServices.flatMap((service) => service.upsell_service_ids));
  const addOns = services.filter((service) => service.service_type === "add_on" && (selectedUpsellIds.size ? selectedUpsellIds.has(service.id) || selectedServiceIds.includes(service.id) : true));
  const caseByCase = services.filter((service) => service.service_type === "case_by_case");
  const selectedJson = useMemo(() => JSON.stringify(selectedServices.map((service, index) => ({
    serviceId: service.id,
    notes: notes[service.id] ?? "",
    sortOrder: index,
    answers: service.questions.map((question) => ({
      questionId: question.id,
      optionIds: toArray(answers[question.id]).filter((value) => question.service_question_options.some((option) => option.id === value)),
      answerText: typeof answers[question.id] === "string" && !question.service_question_options.some((option) => option.id === answers[question.id]) ? answers[question.id] : "",
    })),
  }))), [answers, notes, selectedServices]);

  function toggleService(id: string) {
    setSelectedServiceIds((current) => {
      const removing = current.includes(id);
      if (removing) setPhotoServiceIds((photoIds) => photoIds.filter((item) => item !== id));
      return removing ? current.filter((item) => item !== id) : [...current, id];
    });
  }

  function validatePhotoFiles(files: File[]) {
    const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
    const tooLarge = files.find((file) => file.size > maxPhotoBytes);
    const unsupported = files.find((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
      return file.type ? !file.type.startsWith("image/") : !supportedPhotoExtensions.has(extension);
    });
    if (unsupported) return `${unsupported.name} is not an image file. Please upload a JPEG, PNG, WebP, HEIC, GIF, or AVIF image.`;
    if (tooLarge) return `${tooLarge.name} is larger than 20MB. Please upload a smaller photo or take a lower-resolution picture.`;
    if (totalBytes > maxTotalPhotoBytes) return "The selected photos are over 35MB total. Please remove a few photos or upload smaller versions.";
    return null;
  }

  function handlePhotoChange(serviceId: string, files: FileList | null) {
    const fileArray = Array.from(files ?? []);
    const errorMessage = validatePhotoFiles(fileArray);
    setUploadError(errorMessage);
    setPhotoServiceIds((current) => fileArray.length ? Array.from(new Set([...current, serviceId])) : current.filter((id) => id !== serviceId));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const files = Array.from(event.currentTarget.querySelectorAll<HTMLInputElement>('input[type="file"]')).flatMap((input) => Array.from(input.files ?? []));
    const errorMessage = validatePhotoFiles(files);
    if (errorMessage) {
      event.preventDefault();
      setUploadError(errorMessage);
      setStep(2);
    }
  }

  function setAnswer(question: WizardServiceQuestion, value: string, checked = true) {
    setAnswers((current) => {
      if (question.question_type === "multi_choice") {
        const existing = toArray(current[question.id]);
        return { ...current, [question.id]: checked ? Array.from(new Set([...existing, value])) : existing.filter((item) => item !== value) };
      }
      return { ...current, [question.id]: value };
    });
  }

  function canContinueServices() {
    return selectedServiceIds.length > 0;
  }

  function canContinueDetails() {
    return selectedServices.every((service) => service.questions.every((question) => {
      if (!question.required) return true;
      const answer = answers[question.id];
      if (Array.isArray(answer)) return answer.length > 0;
      return Boolean(answer && answer.trim());
    }));
  }

  function ServiceCard({ service }: { service: WizardService }) {
    const selected = selectedServiceIds.includes(service.id);
    return (
      <button
        type="button"
        onClick={() => toggleService(service.id)}
        className={`rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 hover:shadow-sm ${selected ? "border-[var(--primary)] tone-success ring-2 ring-[color-mix(in_srgb,var(--success)_24%,var(--border))]" : "border-[var(--border)] bg-[var(--card)]"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-bold uppercase tracking-wide text-[var(--primary)]">{serviceBadge(service.service_type)}</div>
            <h3 className="mt-1 text-lg font-bold">{service.name}</h3>
          </div>
          <span className={`rounded-full px-2 py-1 text-xs font-bold ${selected ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>{selected ? "Selected" : "Choose"}</span>
        </div>
        <p className="mt-2 text-sm text-[var(--muted-foreground)]">{service.public_description ?? "Final pricing depends on yard size, access, photos, and site conditions."}</p>
        <p className="mt-3 text-sm font-semibold">{servicePriceLabel(service)}</p>
        {service.requires_parent_approval || service.requires_site_review ? <p className="mt-2 text-xs text-[var(--warning)]">May need admin/parent review before scheduling.</p> : null}
      </button>
    );
  }

  function QuestionInput({ question }: { question: WizardServiceQuestion }) {
    const options = [...question.service_question_options].sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));
    const value = answers[question.id];

    if (question.question_type === "short_text") {
      return <Input value={typeof value === "string" ? value : ""} onChange={(event) => setAnswer(question, event.target.value)} required={question.required} />;
    }
    if (question.question_type === "number") {
      return <Input type="number" value={typeof value === "string" ? value : ""} onChange={(event) => setAnswer(question, event.target.value)} required={question.required} />;
    }
    if (question.question_type === "yes_no") {
      return (
        <div className="flex flex-wrap gap-2">
          {["Yes", "No"].map((label) => <button key={label} type="button" onClick={() => setAnswer(question, label.toLowerCase())} className={`rounded-full border px-4 py-2 text-sm font-semibold ${value === label.toLowerCase() ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]" : "border-[var(--border)] bg-[var(--card)]"}`}>{label}</button>)}
        </div>
      );
    }
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = question.question_type === "multi_choice" ? toArray(value).includes(option.id) : value === option.id;
          return (
            <button key={option.id} type="button" onClick={() => setAnswer(question, option.id, !selected)} className={`rounded-full border px-4 py-2 text-sm font-semibold ${selected ? "border-[var(--primary)] bg-[var(--primary)] text-[var(--primary-foreground)]" : "border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)]"}`}>
              {option.label}
              {Number(option.duration_modifier_minutes ?? 0) ? <span className="ml-1 opacity-80">+{option.duration_modifier_minutes}m</span> : null}
            </button>
          );
        })}
        {!options.length ? <p className="text-sm text-[var(--muted-foreground)]">No answer options are active yet.</p> : null}
      </div>
    );
  }

  return (
    <form action={submitQuoteRequest} onSubmit={handleSubmit} className="grid gap-6" noValidate>
      <input type="hidden" name="selectedServicesJson" value={selectedJson} />
      <input type="hidden" name="requestedServiceId" value={selectedServiceIds[0] ?? ""} />
      <div className="flex flex-wrap gap-2">
        {stepLabels.map((label, index) => (
          <button key={label} type="button" onClick={() => setStep(index)} className={`rounded-full px-3 py-1 text-sm font-semibold ${step === index ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"}`}>{index + 1}. {label}</button>
        ))}
      </div>
      {error ? <div className="rounded-lg tone-danger p-3 text-sm font-medium text-[var(--danger)]">{error}</div> : null}
      {uploadError ? <div className="rounded-lg tone-danger p-3 text-sm font-medium text-[var(--danger)]">{uploadError}</div> : null}

      <Card className={step === 0 ? "space-y-5" : "hidden"}>
          <div>
            <h2 className="text-2xl font-black">Where is the work?</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">Start with the property address so we can check the service area before you spend time adding details.</p>
          </div>
          <RequestAddressFields apiKey={apiKey} />
          <div className="flex justify-end"><Button type="button" onClick={() => setStep(1)}>Next: choose services</Button></div>
        </Card>

      <Card className={step === 1 ? "space-y-6" : "hidden"}>
          <div>
            <h2 className="text-2xl font-black">What do you need help with?</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">Choose one or more services. Add-ons appear below as simple upsells after you choose a core service.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {coreServices.map((service) => <ServiceCard key={service.id} service={service} />)}
            {caseByCase.map((service) => <ServiceCard key={service.id} service={service} />)}
          </div>
          {selectedServiceIds.length && addOns.length ? (
            <div className="rounded-2xl border border-[color-mix(in_srgb,var(--success)_35%,var(--border))] tone-success p-4">
              <h3 className="text-lg font-bold">Helpful add-ons</h3>
              <p className="mt-1 text-sm text-[var(--success)]">Want to add any of these while the crew is there?</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {addOns.map((service) => <ServiceCard key={service.id} service={service} />)}
              </div>
            </div>
          ) : null}
          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(0)}>Back</Button>
            <Button type="button" onClick={() => setStep(2)} disabled={!canContinueServices()}>Next: answer details</Button>
          </div>
        </Card>

      <Card className={step === 2 ? "space-y-6" : "hidden"}>
          <div>
            <h2 className="text-2xl font-black">Service details</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">Answer quick questions and optionally attach photos. Photos help the admin estimate workload and route timing, but they are not required to submit.</p>
          </div>
          {selectedServices.map((service) => (
            <div key={service.id} className="rounded-2xl border border-[var(--border)] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-bold">{service.name}</h3>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">{service.public_description}</p>
                </div>
                <button type="button" onClick={() => toggleService(service.id)} className="text-sm font-semibold text-[var(--danger)]">Remove</button>
              </div>
              <div className="mt-5 grid gap-5">
                {service.questions.map((question) => (
                  <div key={question.id} className="grid gap-2">
                    <div>
                      <h4 className="font-bold">{question.question_text}{question.required ? <span className="text-[var(--danger)]"> *</span> : null}</h4>
                      {question.help_text ? <p className="text-sm text-[var(--muted-foreground)]">{question.help_text}</p> : null}
                    </div>
                    <QuestionInput question={question} />
                  </div>
                ))}
                {!service.questions.length ? <p className="text-sm text-[var(--muted-foreground)]">No extra questions for this service yet.</p> : null}
                <Field label={`Notes for ${service.name}`} hint="Keep it short. Example: backyard is taller than front, gate is on left, mulch is already purchased.">
                  <Textarea value={notes[service.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [service.id]: event.target.value }))} />
                </Field>
                <Field label={`Photos for ${service.name} (optional)`} hint="Optional. JPEG, PNG, WebP, HEIC, GIF, or AVIF. Up to 20MB per photo and 35MB total per request.">
                  <Input name={`servicePhotos:${service.id}`} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif,image/avif,image/*" multiple onChange={(event) => handlePhotoChange(service.id, event.currentTarget.files)} />
                </Field>
                {photoServiceIds.includes(service.id) ? <p className="text-xs font-semibold text-[var(--success)]">Photos attached for {service.name}.</p> : null}
              </div>
            </div>
          ))}
          {!selectedServices.length ? <p className="text-sm text-[var(--muted-foreground)]">Choose at least one service first.</p> : null}
          {selectedServices.length && !canContinueDetails() ? <p className="text-sm font-semibold text-[var(--warning)]">Answer required service questions to continue. Photos are optional.</p> : null}
          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button type="button" onClick={() => setStep(3)} disabled={!selectedServices.length || !canContinueDetails()}>Next: contact</Button>
          </div>
        </Card>

      <Card className={step === 3 ? "space-y-5" : "hidden"}>
          <div>
            <h2 className="text-2xl font-black">Contact and timing</h2>
            <p className="mt-2 text-sm text-[var(--muted-foreground)]">No account is required to submit this request. If you already have one, you can also <Link href="/auth/login" className="font-semibold text-[var(--primary)]">log in</Link>.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name"><Input name="name" required autoComplete="name" /></Field>
            <Field label="Email"><Input name="email" type="email" required autoComplete="email" /></Field>
            <Field label="Phone"><Input name="phone" required autoComplete="tel" /></Field>
            <Field label="Preferred dates/window"><Input name="preferredDates" placeholder="Example: next Saturday morning" /></Field>
          </div>
          <div className="grid gap-3 rounded-xl border border-[var(--border)] p-4 text-sm">
            <strong>Property notes</strong>
            <label><input className="mr-2" type="checkbox" name="debrisPresent" /> Debris/sticks present</label>
            <label><input className="mr-2" type="checkbox" name="dogWastePresent" /> Dog waste present</label>
            <label><input className="mr-2" type="checkbox" name="petsPresent" /> Pets on property</label>
          </div>
          <Field label="Gate/access notes"><Textarea name="gateAccess" /></Field>
          <Field label="Anything else we should know?"><Textarea name="customerNotes" /></Field>
          <div className="grid gap-3 rounded-xl bg-[var(--muted)] p-4 text-sm">
            <label><input className="mr-2" type="checkbox" name="termsAccepted" required /> I accept the quote request terms and understand unsafe/out-of-scope jobs may be declined.</label>
            <Field label="Type your name to accept terms"><Input name="acceptedName" required /></Field>
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <Button type="button" variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button type="submit" size="lg" disabled={!selectedServices.length}>Submit quote request</Button>
          </div>
        </Card>
    </form>
  );
}
