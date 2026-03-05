import useSWR from "swr";

interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  isDefault: boolean;
  _count: {
    orders: number;
    factories: number;
  };
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useProjects() {
  const { data, error, isLoading, mutate } = useSWR<{ success: boolean; data: Project[] }>(
    "/api/projects",
    fetcher
  );

  return {
    projects: data?.data ?? [],
    isLoading,
    isError: !!error,
    mutate,
  };
}
