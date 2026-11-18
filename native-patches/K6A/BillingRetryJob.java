package com.seamenpool.billing;

import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;

/** Durable retry intent only: stores NO token, receipt or ownership flag. */
public final class BillingRetryJob extends JobService {
    private static final int ID=0x534541;
    private int generation;
    static void update(Context context,boolean retry){
        JobScheduler scheduler=(JobScheduler)context.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if(scheduler==null)return;
        try{
            if(!retry){scheduler.cancel(ID);return;}
            if(scheduler.getPendingJob(ID)!=null)return;
            scheduler.schedule(new JobInfo.Builder(ID,new ComponentName(context,BillingRetryJob.class))
                .setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setPersisted(true)
                .setMinimumLatency(30000).setBackoffCriteria(30000,JobInfo.BACKOFF_POLICY_EXPONENTIAL).build());
        }catch(RuntimeException ignored){/* Foreground/resume still re-queries. OS retry is best-effort. */}
    }
    @Override public boolean onStartJob(JobParameters parameters){
        final int ticket=++generation;
        PlayBillingClient.get(this).checkForJob(result->{if(ticket==generation){generation++;jobFinished(parameters,result.retry);}});
        return true;
    }
    @Override public boolean onStopJob(JobParameters parameters){generation++;return true;}
}
