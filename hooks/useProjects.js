'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, activities(activity_summary, created_at)')
        .order('created_at', { foreignTable: 'activities', ascending: false });

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      setProjects(data);
      setLoading(false);
    };

    fetchProjects();
  }, []);

  return { projects, loading, error };
};


export const insertProjectsIntoSupabase = async (projects) => {
  const { data, error } = await supabase.from("projects").insert(projects);

  if (error) {
    console.error("Error inserting projects:", error.message);
    return { success: false, error: error.message };
  }

  console.log("Projects successfully inserted:", data);
  return { success: true, data };
};