import axios from 'axios';
import {
  PreTestData,
  StudentProfileData,
  RecommendationsResponse,
  PostTestData,
  AdminStatsData,
  AdminSessionItem,
  EvaluationChartsData,
  TopicItem,
  CourseItem
} from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const initSession = async (mode: 'pilot' | 'demo' = 'pilot') => {
  const res = await api.post<{ session_code: string; mode: string }>('/session/init', { mode });
  return res.data;
};

export const submitPreTest = async (data: PreTestData) => {
  const res = await api.post('/pre-test', data);
  return res.data;
};

export const saveProfile = async (session_code: string, profile: StudentProfileData) => {
  const res = await api.post('/profile', {
    session_code,
    ...profile,
  });
  return res.data;
};

export const getRecommendations = async (params: {
  session_code: string;
  top_k?: number;
  custom_alpha?: number;
  custom_beta?: number;
  custom_gamma?: number;
}) => {
  const res = await api.post<RecommendationsResponse>('/recommendations', params);
  return res.data;
};

export const submitPostTest = async (data: PostTestData) => {
  const res = await api.post<{
    status: string;
    session_code: string;
    sus_final_score: number;
    certainty_difference: number;
  }>('/post-test', data);
  return res.data;
};

export const fetchTopics = async () => {
  const res = await api.get<TopicItem[]>('/topics');
  return res.data;
};

export const fetchCourses = async () => {
  const res = await api.get<CourseItem[]>('/courses');
  return res.data;
};

export const fetchAdminStats = async () => {
  const res = await api.get<AdminStatsData>('/admin/stats');
  return res.data;
};

export const fetchAdminSessions = async () => {
  const res = await api.get<AdminSessionItem[]>('/admin/sessions');
  return res.data;
};

export const deleteAdminSession = async (sessionCode: string) => {
  const res = await api.delete<{ status: string; deleted: string }>(`/admin/sessions/${sessionCode}`);
  return res.data;
};

export const cleanupAdminSessions = async (filterType: 'empty' | 'incomplete' | 'demo' | 'all') => {
  const res = await api.post<{ status: string; deleted_count: number; remaining_count: number }>('/admin/cleanup', {
    filter_type: filterType,
  });
  return res.data;
};

export const fetchEvaluationCharts = async () => {
  const res = await api.get<EvaluationChartsData>('/admin/evaluation-charts');
  return res.data;
};

export const uploadTopicsFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/admin/import-topics', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const uploadStagFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post('/profile/upload-stag', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const parseStagText = async (rawText: string) => {
  const res = await api.post('/profile/parse-stag-text', { raw_text: rawText });
  return res.data;
};
