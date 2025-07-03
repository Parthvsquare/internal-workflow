import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { WorkflowBuilderService } from './workflow-builder.service';
import {
  CreateWorkflowDto,
  UpdateWorkflowDto,
  WorkflowResponseDto,
  WorkflowExecutionDto,
} from './dto/workflow.dto';

@ApiTags('Workflow Builder')
@Controller('/workflows')
export class WorkflowBuilderController {
  constructor(private readonly workflowService: WorkflowBuilderService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new workflow',
    description:
      'Create a workflow with trigger, steps, and connections. Example: Lead status change → Create task.',
  })
  @ApiResponse({
    status: 201,
    description: 'Workflow created successfully',
    type: WorkflowResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input or missing registry entries',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  @ApiBody({ type: CreateWorkflowDto })
  async createWorkflow(
    @Body() createWorkflowDto: CreateWorkflowDto
  ): Promise<WorkflowResponseDto> {
    return this.workflowService.createWorkflow(createWorkflowDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List all workflows',
    description: 'Get a list of all workflows with their configuration',
  })
  @ApiResponse({
    status: 200,
    description: 'List of workflows retrieved successfully',
    type: [WorkflowResponseDto],
  })
  async listWorkflows(): Promise<WorkflowResponseDto[]> {
    return this.workflowService.listWorkflows();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get workflow by ID',
    description: 'Retrieve a specific workflow with its full configuration',
  })
  @ApiParam({
    name: 'id',
    description: 'Workflow UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow retrieved successfully',
    type: WorkflowResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Workflow not found',
  })
  async getWorkflow(
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<WorkflowResponseDto> {
    return this.workflowService.getWorkflow(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Update workflow',
    description:
      'Update an existing workflow. Creates a new version if steps or trigger are modified.',
  })
  @ApiParam({
    name: 'id',
    description: 'Workflow UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow updated successfully',
    type: WorkflowResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Workflow not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - Invalid input',
  })
  @ApiBody({ type: UpdateWorkflowDto })
  async updateWorkflow(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateWorkflowDto: UpdateWorkflowDto
  ): Promise<WorkflowResponseDto> {
    return this.workflowService.updateWorkflow(id, updateWorkflowDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete workflow',
    description: 'Delete a workflow and all its versions',
  })
  @ApiParam({
    name: 'id',
    description: 'Workflow UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 204,
    description: 'Workflow deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Workflow not found',
  })
  async deleteWorkflow(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.workflowService.deleteWorkflow(id);
  }

  @Post(':id/execute')
  @ApiOperation({
    summary: 'Execute workflow manually',
    description: 'Manually trigger a workflow execution with custom data',
  })
  @ApiParam({
    name: 'id',
    description: 'Workflow UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Workflow execution started',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        runId: { type: 'string' },
        error: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Workflow not found',
  })
  @ApiBody({ type: WorkflowExecutionDto })
  async executeWorkflow(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() executionDto: WorkflowExecutionDto
  ): Promise<{ success: boolean; runId?: string; error?: string }> {
    return this.workflowService.executeWorkflow(id, executionDto);
  }
}
