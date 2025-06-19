import { int, text, varchar, mysqlTable } from "drizzle-orm/mysql-core";

export const MockInterview = mysqlTable('elevate_mockInterview', {
    id: int('id').primaryKey().autoincrement(),
    jsonMockResp: text('jsonMockResp').notNull(),
    jobPosition: varchar('jobPosition', { length: 255 }).notNull(),
    jobDesc: varchar('jobDesc', { length: 255 }).notNull(),
    jobExperience: varchar('jobExperience', { length: 255 }).notNull(),
    createdBy: varchar('createdBy', { length: 255 }).notNull(),
    createdAt: varchar('createdAt', { length: 255 }),
    mockId: varchar('mockId', { length: 255 }).notNull()
});

export const Question = mysqlTable('elevate_question', {
    id: int('id').primaryKey().autoincrement(),
    MockQuestionJsonResp: text('MockQuestionJsonResp').notNull(),
    jobPosition: varchar('jobPosition', { length: 255 }).notNull(),
    jobDesc: varchar('jobDesc', { length: 255 }).notNull(),
    jobExperience: varchar('jobExperience', { length: 255 }).notNull(),
    typeQuestion: varchar('typeQuestion', { length: 255 }).notNull(),
    company: varchar('company', { length: 255 }).notNull(),
    createdBy: varchar('createdBy', { length: 255 }).notNull(),
    createdAt: varchar('createdAt', { length: 255 }),
    mockId: varchar('mockId', { length: 255 }).notNull()
});

export const UserAnswer = mysqlTable('elevate_userAnswer', {
    id: int('id').primaryKey().autoincrement(),
    mockId: varchar('mockId', { length: 255 }).notNull(),
    question: varchar('question', { length: 255 }).notNull(),
    correctAns: text('correctAns'),
    userAns: text('userAns'),
    feedback: text('feedback'),
    rating: varchar('rating', { length: 255 }),
    userEmail: varchar('userEmail', { length: 255 }),
    createdAt: varchar('createdAt', { length: 255 })
});