import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/server";
import { deactivateServiceQuestion, deactivateServiceQuestionOption, upsertServiceQuestion, upsertServiceQuestionOption } from "./actions";

type OptionRow = {
  id: string;
  question_id: string;
  label: string;
  value: string;
  price_modifier: number | string;
  duration_modifier_minutes: number;
  risk_modifier: string;
  requires_parent_approval: boolean;
  active: boolean;
  sort_order: number;
};

type QuestionRow = {
  id: string;
  service_id: string;
  question_text: string;
  question_type: string;
  required: boolean;
  help_text: string | null;
  active: boolean;
  sort_order: number;
  service_question_options?: OptionRow[];
};

function QuestionForm({ serviceId, question }: { serviceId: string; question?: QuestionRow }) {
  return (
    <form action={upsertServiceQuestion} className="grid gap-3">
      <input type="hidden" name="serviceId" value={serviceId} />
      {question ? <input type="hidden" name="id" value={question.id} /> : null}
      <Field label="Question"><Input name="questionText" defaultValue={question?.question_text ?? ""} required /></Field>
      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Type">
          <Select name="questionType" defaultValue={question?.question_type ?? "single_choice"}>
            <option value="single_choice">Single choice buttons</option>
            <option value="multi_choice">Multiple choice buttons</option>
            <option value="yes_no">Yes / no</option>
            <option value="short_text">Short text</option>
            <option value="number">Number</option>
          </Select>
        </Field>
        <Field label="Sort"><Input name="sortOrder" type="number" defaultValue={question?.sort_order ?? 0} /></Field>
        <div className="grid content-end gap-2 text-sm">
          <label><input className="mr-2" type="checkbox" name="required" defaultChecked={question?.required ?? false} /> Required</label>
          <label><input className="mr-2" type="checkbox" name="active" defaultChecked={question?.active ?? true} /> Active</label>
        </div>
      </div>
      <Field label="Help text"><Textarea name="helpText" defaultValue={question?.help_text ?? ""} /></Field>
      <Button type="submit" size="sm">{question ? "Save question" : "Add question"}</Button>
    </form>
  );
}

function OptionForm({ serviceId, questionId, option }: { serviceId: string; questionId: string; option?: OptionRow }) {
  return (
    <form action={upsertServiceQuestionOption} className="grid gap-3 rounded-xl border border-[var(--border)] p-3">
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="questionId" value={questionId} />
      {option ? <input type="hidden" name="id" value={option.id} /> : null}
      <div className="grid gap-3 md:grid-cols-[1fr_1fr_100px_100px]">
        <Field label="Answer label"><Input name="label" defaultValue={option?.label ?? ""} required /></Field>
        <Field label="Value"><Input name="value" defaultValue={option?.value ?? ""} placeholder="auto if blank" /></Field>
        <Field label="$ impact"><Input name="priceModifier" type="number" step="0.01" defaultValue={option?.price_modifier ?? 0} /></Field>
        <Field label="Minutes"><Input name="durationModifierMinutes" type="number" defaultValue={option?.duration_modifier_minutes ?? 0} /></Field>
      </div>
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <Field label="Risk"><Select name="riskModifier" defaultValue={option?.risk_modifier ?? "none"}><option value="none">None</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option></Select></Field>
        <label><input className="mr-2" type="checkbox" name="requiresParentApproval" defaultChecked={option?.requires_parent_approval ?? false} /> Parent/admin approval</label>
        <label><input className="mr-2" type="checkbox" name="active" defaultChecked={option?.active ?? true} /> Active</label>
        <label className="flex items-center gap-2">Sort <Input className="w-24" name="sortOrder" type="number" defaultValue={option?.sort_order ?? 0} /></label>
      </div>
      <Button type="submit" size="sm" variant="outline">{option ? "Save answer" : "Add answer"}</Button>
    </form>
  );
}

export default async function ServiceQuestionsPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const [{ data: service }, { data: questions, error }] = await Promise.all([
    supabase.from("services").select("id, name, service_type").eq("id", id).maybeSingle(),
    supabase.from("service_questions").select("id, service_id, question_text, question_type, required, help_text, active, sort_order, service_question_options(id, question_id, label, value, price_modifier, duration_modifier_minutes, risk_modifier, requires_parent_approval, active, sort_order)").eq("service_id", id).order("sort_order"),
  ]);

  if (!service) notFound();
  const rows = ((questions ?? []) as QuestionRow[]).map((question) => ({
    ...question,
    service_question_options: [...(question.service_question_options ?? [])].sort((a, b) => a.sort_order - b.sort_order),
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/services" className="text-sm font-semibold text-[var(--primary)]">← Services</Link>
        <h1 className="mt-2 text-3xl font-black">Questions for {service.name}</h1>
        <p className="mt-2 text-[var(--muted-foreground)]">Create button-answer intake questions. Answers can adjust estimated price, workload minutes, and approval risk.</p>
        {query.error ? <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-[var(--danger)]">{query.error}</div> : null}
        {query.saved ? <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">Saved.</div> : null}
        {error ? <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Service questions table is not available yet. Apply db/migrations/006_service_questions.sql or db/setup.sql in Supabase.</div> : null}
      </div>

      <Card>
        <h2 className="mb-4 text-xl font-bold">Add question</h2>
        <QuestionForm serviceId={id} />
      </Card>

      <div className="grid gap-4">
        {rows.map((question) => (
          <Card key={question.id}>
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold">{question.question_text}</h2>
                <p className="text-sm text-[var(--muted-foreground)]">{question.question_type} · {question.required ? "Required" : "Optional"} · {question.active ? "Active" : "Inactive"}</p>
              </div>
              {question.active ? (
                <form action={deactivateServiceQuestion}>
                  <input type="hidden" name="id" value={question.id} />
                  <input type="hidden" name="serviceId" value={id} />
                  <Button type="submit" size="sm" variant="outline">Deactivate</Button>
                </form>
              ) : null}
            </div>
            <QuestionForm serviceId={id} question={question} />
            <div className="mt-5 space-y-3">
              <h3 className="font-bold">Button answers / options</h3>
              {question.service_question_options?.map((option) => (
                <div key={option.id} className="grid gap-2">
                  <OptionForm serviceId={id} questionId={question.id} option={option} />
                  {option.active ? (
                    <form action={deactivateServiceQuestionOption}>
                      <input type="hidden" name="id" value={option.id} />
                      <input type="hidden" name="serviceId" value={id} />
                      <Button type="submit" size="sm" variant="ghost">Deactivate answer</Button>
                    </form>
                  ) : null}
                </div>
              ))}
              <OptionForm serviceId={id} questionId={question.id} />
            </div>
          </Card>
        ))}
        {rows.length ? null : <Card><p className="text-sm text-[var(--muted-foreground)]">No questions yet.</p></Card>}
      </div>
    </div>
  );
}
