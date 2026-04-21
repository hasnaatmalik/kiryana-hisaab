import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Customer, Supplier, Item, Transaction } from '@/lib/supabase';

// Fetch functions
export const fetchItems = async (): Promise<Item[]> => {
  const { data, error } = await supabase.from('items').select('*').order('id', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const fetchCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase.from('customers').select('*').order('id', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const fetchSuppliers = async (): Promise<Supplier[]> => {
  const { data, error } = await supabase.from('suppliers').select('*').order('id', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const fetchTransactions = async (): Promise<Transaction[]> => {
  const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
  if (error) throw error;
  return data || [];
};

// React Query Hooks
export const useItems = () => {
  return useQuery({
    queryKey: ['items'],
    queryFn: fetchItems,
  });
};

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: fetchCustomers,
  });
};

export const useSuppliers = () => {
  return useQuery({
    queryKey: ['suppliers'],
    queryFn: fetchSuppliers,
  });
};

export const useTransactions = () => {
  return useQuery({
    queryKey: ['transactions'],
    queryFn: fetchTransactions,
  });
};

export const useSupabaseRealtime = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          console.log('Realtime change received!', payload);
          // Invalidate all queries when any table changes
          queryClient.invalidateQueries({ queryKey: ['items'] });
          queryClient.invalidateQueries({ queryKey: ['customers'] });
          queryClient.invalidateQueries({ queryKey: ['suppliers'] });
          queryClient.invalidateQueries({ queryKey: ['transactions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};

// Mutations
export const useAddTransaction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id' | 'date'> & { date?: string }) => {
      const { data, error } = await supabase.from('transactions').insert(transaction).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });
};

export const useDeleteTransactions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      const { error } = await supabase.from('transactions').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['transactions'] }),
  });
};

export const useAddCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id'>) => {
      const { data, error } = await supabase.from('customers').insert(customer).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<Customer> }) => {
      const { data, error } = await supabase.from('customers').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customers'] }),
  });
};

export const useAddSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (supplier: Omit<Supplier, 'id'>) => {
      const { data, error } = await supabase.from('suppliers').insert(supplier).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<Supplier> }) => {
      const { data, error } = await supabase.from('suppliers').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('suppliers').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  });
};

export const useAddItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<Item, 'id'>) => {
      const { data, error } = await supabase.from('items').insert(item).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
};

export const useUpdateItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number, updates: Partial<Item> }) => {
      const { data, error } = await supabase.from('items').update(updates).eq('id', id).select();
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
};

export const useDeleteItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  });
};
