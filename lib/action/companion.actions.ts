"use server" // This directive marks all exports in this file as server actions that can only run on the server side

// Import the auth function from Clerk for user authentication
import { auth } from "@clerk/nextjs/server";
// Import the function that creates a connection to the Supabase database
import { createSupabaseClient } from "@/lib/supbase";

/**
 * Creates a new companion in the database
 * @param formData - The form data containing companion details (name, subject, topic, etc.)
 * @returns The newly created companion object
 */
export const createCompanion = async(formData: CreateCompanion) => {
    // Get the current user's ID from Clerk authentication and rename it to 'author'
    const { userId: author } = await auth();

    // Create a connection to the Supabase database
    const supabase = createSupabaseClient();


    const { data, error } = await supabase
    // specify that we want to work with the companions table
    .from("companions")
    // insert all the properties from the formData object and add the author field to it
    .insert({...formData, author})
    // immediately select and retrieve the newly created row
    .select()

    // If there's an error or no data returned, throw an error with the error message or a default message
    if (error || !data) throw new Error(error?.message || "Failed to create companion");

    // Return the first (and only) item from the data array
    return data[0];
}

/**
 * Retrieves companions from the database with optional filtering and pagination
 * @param options - Object containing query parameters
 * @param options.limit - Maximum number of companions to return (default: 10)
 * @param options.page - Page number for pagination (default: 1)
 * @param options.subject - Optional subject filter
 * @param options.topic - Optional topic filter
 * @returns Array of companion objects matching the criteria
 */
export const getAllCompanions = async ({ limit = 10, page = 1, subject, topic}: GetAllCompanions) => {
    // Create a connection to the Supabase database
    const supabase = createSupabaseClient();

    // Initialize a query to select all columns from the 'companions' table
    let query = supabase.from("companions").select();

    // Apply filters based on the provided parameters
    if(subject && topic) {
        // If both subject and topic are provided, filter by subject and then by topic or name
        query = query.ilike("subject", `%${subject}%`)
            .or(`topic.ilike.%${topic}%, name.ilike.%{topic}%`)
    } else if(subject) {
        // If only subject is provided, filter by subject
        // ilike performs a case-insensitive search with % as wildcards
        query = query.ilike("subject", `%${subject}%`)
    } else if(topic) {
        // If only topic is provided, filter by topic or name
        query = query.or(`topic.ilike.%${topic}%, name.ilike.%${topic}%`)
    }

    // Apply pagination to the query
    // range() takes the start and end indices of the records to return
    // For page 1 with limit 10, it would be range(0, 9)
    query = query.range((page - 1) * limit, page * limit - 1);

    // Execute the query and get the results
    // Rename 'data' to 'companions' for clarity
    const { data: companions, error } = await query;

    // If there's an error, throw it with the error message
    if(error) throw new Error(error.message);

    // Return the array of companions
    return companions;
}


export const getCompanion = async (id: string) => {
    // 1. Get ready to talk to the database:
    // This line creates a special tool (a "client") that knows how to communicate
    // with your Supabase database. Think of it as getting the right key to open the filing cabinet.
    const supabase = createSupabaseClient();

    // 2. Ask the database for a specific companion:
    // Here, we're telling Supabase:
    //   - .from("companions"): "Look inside the 'companions' drawer of the filing cabinet."
    //   - .select(): "If you find anything, I want all the information about it (all columns)."
    //   - .eq("id", id): "I'm looking for the companion whose 'id' (a unique identifier)
    //                    matches the 'id' I've given you as an input to this function."
    // The 'await' keyword means we'll wait here until Supabase finishes searching and gives us back two things:
    //   - 'data': The information about the companion if found.
    //   - 'error': Any error message if something went wrong during the search.
    const {data, error} = await supabase
    .from("companions")
    .select()
    .eq("id", id);

    if (error) return console.log(error);

    // 4. Give back the found companion
    return data[0];
}

export const addToSessionHistory = async (companionId: string) => {
    const { userId } = await auth()
    const supabase = createSupabaseClient()
    const { data, error } = await supabase
    .from("session_history")
    .insert({
        companion_id: companionId,
        user_id: userId,
    })
    if (error) throw new Error(error.message);

    return data;
}

// the function takes one optional parameter limit, which is set to 10 by default
export const getRecentSessions = async (limit = 10) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
    // specifies the table first
    .from("session_history")
    // selecting all information related to the companionId in the companions table
    .select(`companions:companion_id (*)`)
    // orders the results by the created_at column in descending order
    .order("created_at", { ascending: false })
    // limits the number of results to the value of the limit parameter
    .limit(limit)

    if (error) throw new Error(error.message);
    
    return data.map(({ companions }) => companions)
}

// the function takes one optional parameter limit, which is set to 10 by default
export const getUserSessions = async (userId: string, limit = 10) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
    // specifies the table first
    .from("session_history")
    // selecting all information related to the companionId in the companions table
    .select(`companions:companion_id (*)`)
    // filters the results to only include sessions for the specified user
    .eq("user_id", userId)
    // orders the results by the created_at column in descending order
    .order("created_at", { ascending: false })
    // limits the number of results to the value of the limit parameter
    .limit(limit)

    if (error) throw new Error(error.message);
    
    return data.map(({ companions }) => companions)
}

export const getUserCompanions = async (userId: string) => {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase
    // specifies the table first
    .from("companions")
    .select()
    // filters the results to only include sessions for the specified user
    .eq("author", userId)

    if (error) throw new Error(error.message);
    
    return data
}

// This function checks if a user has permission to create a new companion based on their subscription plan
export const newCompanionPermissions = async() => {
    // Get the current user's ID and a 'has' function to check their permissions from Clerk auth
    const {userId, has} = await auth();
    // Create a connection to our Supabase database
    const supabase = createSupabaseClient();
    
    // Initialize the companion limit to 0 by default
    let limit = 0;
    
    // If the user has a "pro" plan, they have unlimited companions
    if(has({plan: "pro"})) {
        return true;
    } 
    // If user has the "3_active_companions" feature, set their limit to 3
    else if(has({ feature: "3_active_companions"})) {
        limit = 3;
    } 
    // If user has the "10_active_companions" feature, set their limit to 10
    else if(has({ feature: "10_active_companions"})) {
        limit = 10;
    }

    // Query the database to count how many companions this user has created
    const { data, error } = await supabase
    .from("companions")
    .select("id", { count: "exact" }) // Only select the id field since we just need the count
    .eq("author", userId)             // Filter to only companions created by this user
    
    // If there was an error querying the database, throw it
    if(error) throw new Error(error.message);

    // Get the count of user's existing companions
    const companionCount = data?.length;

    // If user has reached or exceeded their limit, return false (can't create more)
    if(companionCount >= limit) {
        return false
    } else {
        // If user is under their limit, return true (can create more)
        return true
    }
}