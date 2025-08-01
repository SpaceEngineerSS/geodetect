import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Frontend Supabase client'ı

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
            const { data: profileData, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            if (error) throw error;
            setProfile(profileData);
        }
      } catch (error) {
        console.error("Oturum verisi alınırken hata:", error);
      } finally {
        setLoading(false);
      }
    };
    
    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
         if (session?.user) {
            const { data: profileData } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
            setProfile(profileData);
        } else {
            setProfile(null);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);
  
  const value = {
    session,
    user,
    profile,
    loading,
    login: async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    },
    signup: async (email, password, username) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    avatar_url: `https://api.dicebear.com/9.x/adventurer/svg?seed=${username}`
                },
            },
        });
        if (error) throw error;
    },
    logout: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },
    updateProfile: async (updates) => {
        if (!user) throw new Error("Kullanıcı giriş yapmamış.");

        const { error } = await supabase.from('profiles').upsert({
            id: user.id,
            ...updates,
        });

        if (error) throw error;
        setProfile(prevProfile => ({ ...prevProfile, ...updates }));
    }
  };

  return (
    <UserContext.Provider value={value}>
      {!loading && children}
    </UserContext.Provider>
  );
};
