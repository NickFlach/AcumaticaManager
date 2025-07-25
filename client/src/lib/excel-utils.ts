import { utils, writeFile, read } from 'xlsx';
import type { Project, Task, TimeEntry, RFI, ChangeOrder, Risk } from '@shared/schema';
import type { ExcelExportOptions, ExcelImportResult } from '@/types';

export class ExcelUtils {
  static async exportToExcel(data: any[], filename: string, sheetName: string = 'Sheet1') {
    try {
      const worksheet = utils.json_to_sheet(data);
      const workbook = utils.book_new();
      utils.book_append_sheet(workbook, worksheet, sheetName);
      
      // Auto-size columns
      const range = utils.decode_range(worksheet['!ref'] || 'A1');
      const colWidths = [];
      for (let C = range.s.c; C <= range.e.c; ++C) {
        let maxWidth = 10;
        for (let R = range.s.r; R <= range.e.r; ++R) {
          const cellAddress = utils.encode_cell({ r: R, c: C });
          const cell = worksheet[cellAddress];
          if (cell && cell.v) {
            const cellValue = cell.v.toString();
            maxWidth = Math.max(maxWidth, cellValue.length);
          }
        }
        colWidths.push({ width: Math.min(maxWidth + 2, 50) });
      }
      worksheet['!cols'] = colWidths;
      
      writeFile(workbook, filename);
      return { success: true, message: 'Export completed successfully' };
    } catch (error) {
      console.error('Excel export error:', error);
      return { success: false, message: 'Export failed: ' + (error as Error).message };
    }
  }

  static async importFromExcel(file: File, type: string): Promise<ExcelImportResult> {
    try {
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = utils.sheet_to_json(worksheet);

      const result: ExcelImportResult = {
        success: true,
        recordsImported: 0,
        errors: [],
        warnings: []
      };

      // Validate and transform data based on type
      for (let i = 0; i < data.length; i++) {
        try {
          const row = data[i] as any;
          const validationResult = this.validateRow(row, type, i + 2); // +2 for header row
          
          if (validationResult.isValid) {
            result.recordsImported++;
          } else {
            result.errors.push(...validationResult.errors);
          }
          
          if (validationResult.warnings.length > 0) {
            result.warnings.push(...validationResult.warnings);
          }
        } catch (error) {
          result.errors.push(`Row ${i + 2}: ${(error as Error).message}`);
        }
      }

      if (result.errors.length > 0) {
        result.success = false;
      }

      return result;
    } catch (error) {
      return {
        success: false,
        recordsImported: 0,
        errors: [`File processing error: ${(error as Error).message}`],
        warnings: []
      };
    }
  }

  private static validateRow(row: any, type: string, rowNumber: number) {
    const errors: string[] = [];
    const warnings: string[] = [];
    let isValid = true;

    switch (type) {
      case 'projects':
        if (!row.name || row.name.trim() === '') {
          errors.push(`Row ${rowNumber}: Project name is required`);
          isValid = false;
        }
        if (!row.clientName || row.clientName.trim() === '') {
          errors.push(`Row ${rowNumber}: Client name is required`);
          isValid = false;
        }
        if (!row.projectCode || row.projectCode.trim() === '') {
          errors.push(`Row ${rowNumber}: Project code is required`);
          isValid = false;
        }
        break;

      case 'tasks':
        if (!row.name || row.name.trim() === '') {
          errors.push(`Row ${rowNumber}: Task name is required`);
          isValid = false;
        }
        if (!row.projectId || row.projectId.trim() === '') {
          errors.push(`Row ${rowNumber}: Project ID is required`);
          isValid = false;
        }
        break;

      case 'time-entries':
        if (!row.projectId || row.projectId.trim() === '') {
          errors.push(`Row ${rowNumber}: Project ID is required`);
          isValid = false;
        }
        if (!row.userId || row.userId.trim() === '') {
          errors.push(`Row ${rowNumber}: User ID is required`);
          isValid = false;
        }
        if (!row.hours || isNaN(parseFloat(row.hours))) {
          errors.push(`Row ${rowNumber}: Valid hours value is required`);
          isValid = false;
        }
        if (!row.date) {
          errors.push(`Row ${rowNumber}: Date is required`);
          isValid = false;
        }
        break;
    }

    return { isValid, errors, warnings };
  }

  static async exportProjectsWithTasks(projects: Project[], tasks: Task[]) {
    const projectsData = projects.map(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      const totalTaskHours = projectTasks.reduce((sum, task) => 
        sum + parseFloat(task.actualHours || '0'), 0);
      
      return {
        'Project Code': project.projectCode,
        'Project Name': project.name,
        'Client': project.clientName,
        'Status': project.status,
        'Health': project.health,
        'Progress (%)': project.progress,
        'Budget': project.budgetAmount,
        'Actual Cost': project.actualAmount,
        'Start Date': project.startDate,
        'Due Date': project.dueDate,
        'Task Count': projectTasks.length,
        'Total Hours': totalTaskHours.toFixed(2),
        'Project Type': project.projectType
      };
    });

    return this.exportToExcel(projectsData, 'projects-export.xlsx', 'Projects');
  }

  static async exportTasksWithHierarchy(tasks: Task[]) {
    const tasksData = tasks.map(task => ({
      'Task ID': task.id,
      'Project ID': task.projectId,
      'Parent Task ID': task.parentTaskId || '',
      'Task Code': task.taskCode || '',
      'Task Name': task.name,
      'Description': task.description || '',
      'Status': task.status,
      'Priority': task.priority,
      'Progress (%)': task.progress,
      'Estimated Hours': task.estimatedHours,
      'Actual Hours': task.actualHours,
      'Budget': task.budgetAmount,
      'Actual Cost': task.actualAmount,
      'Start Date': task.startDate,
      'End Date': task.endDate,
      'Due Date': task.dueDate,
      'Assigned To': task.assignedTo || '',
      'Level': task.level,
      'Sort Order': task.sortOrder
    }));

    return this.exportToExcel(tasksData, 'tasks-export.xlsx', 'Tasks');
  }

  static async exportTimeEntries(timeEntries: TimeEntry[]) {
    const timeData = timeEntries.map(entry => ({
      'Entry ID': entry.id,
      'Project ID': entry.projectId,
      'Task ID': entry.taskId || '',
      'User ID': entry.userId,
      'Date': entry.date,
      'Hours': entry.hours,
      'Description': entry.description || '',
      'Hourly Rate': entry.hourlyRate,
      'Total Amount': entry.totalAmount,
      'Approved': entry.isApproved ? 'Yes' : 'No',
      'Approved By': entry.approvedBy || '',
      'Acumatica ID': entry.acumaticaId || '',
      'Lumber Time ID': entry.lumberTimeId || ''
    }));

    return this.exportToExcel(timeData, 'time-entries-export.xlsx', 'Time Entries');
  }

  static generateMPPCompatibleFormat(projects: Project[], tasks: Task[]) {
    // Generate data in a format compatible with Microsoft Project
    const mppData = projects.flatMap(project => {
      const projectTasks = tasks.filter(task => task.projectId === project.id);
      
      const projectRow = {
        'ID': project.id,
        'Name': project.name,
        'Type': 'Project',
        'Start': project.startDate,
        'Finish': project.endDate,
        'Duration': '',
        'Percent Complete': project.progress,
        'Resource Names': '',
        'Notes': project.description || '',
        'Outline Level': 1
      };

      const taskRows = projectTasks.map((task, index) => ({
        'ID': task.id,
        'Name': task.name,
        'Type': 'Task',
        'Start': task.startDate,
        'Finish': task.endDate,
        'Duration': task.estimatedHours ? `${task.estimatedHours}h` : '',
        'Percent Complete': task.progress,
        'Resource Names': task.assignedTo || '',
        'Notes': task.description || '',
        'Outline Level': (task.level || 1) + 1
      }));

      return [projectRow, ...taskRows];
    });

    return this.exportToExcel(mppData, 'project-schedule.xlsx', 'Schedule');
  }
}
