import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import type { ClassroomSummaryDTO } from "../types";
import { MentorService } from "../services/endpoints";

export default function MentorDashboard(){
    
    // Core Data State
    const {user,logout} = useAuth();
    const [classrooms,setClassrooms] = useState<ClassroomSummaryDTO[]>([]);
    const [selectedClass,setSelectedClass] = useState<ClassroomSummaryDTO | null>(null);
    const [isLoading,setIsLoading] = useState(true);
    const [error,setError] = useState('');

    // UI Action State
    //
    const [sortBy, setSortBy] = useState<'consistency' | 'rating' | 'solved' | 'pending' | 'completed' | 'name'>('solved');
    const [showAddStudent,setShowAddStudent] = useState(false);
    const [showAddAssignment, setShowAddAssignment] = useState(false);

    // Form State
    const [newStudentEmail, setNewStudentEmail] = useState('');
    const [assignmentSlug, setAssignmentSlug] = useState('');
    const [assignmentDays, setAssignmentDays] = useState('7'); // Default 1 week deadline

    const fetchDashboard = async () => {
        setIsLoading(true);
        try{
            const response = await MentorService.getDashboard();
        }
    }

}