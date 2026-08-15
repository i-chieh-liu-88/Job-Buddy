export type InterviewQuestion = {
  id: string;
  user_id: string;
  interview_id: string;
  question_text: string;
  my_answer_notes: string | null;
  tags: string[];
  created_at: string;
};

export type QuestionBankItem = InterviewQuestion & {
  company: string;
  position: string;
  round_label: string;
  scheduled_at: string;
};
